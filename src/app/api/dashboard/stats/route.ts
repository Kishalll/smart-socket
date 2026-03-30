import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Run all independent queries in parallel for performance
    const [
      totalBlocks,
      totalRooms,
      totalStudents,
      totalSockets,
      totalEvents,
      totalViolations,
      totalFines,
      pendingViolations,
      unpaidFines,
      recentViolations,
      violationsByBlock,
      topStudentsViolations,
      fineCollectionStats,
    ] = await Promise.all([
      // Total counts
      db.hostelBlock.count(),
      db.room.count(),
      db.student.count(),
      db.socket.count(),
      db.powerEvent.count(),
      db.violationCase.count(),
      db.fine.count(),

      // Pending violations count
      db.violationCase.count({
        where: { caseStatus: 'Pending' },
      }),

      // Unpaid fines total amount
      db.fine.aggregate({
        where: { paymentStatus: 'Pending' },
        _sum: { fineAmount: true },
      }),

      // Recent 10 violations with full relations
      db.violationCase.findMany({
        take: 10,
        orderBy: { detectedTime: 'desc' },
        include: {
          event: {
            include: {
              socket: {
                include: {
                  room: {
                    include: {
                      block: true,
                    },
                  },
                },
              },
            },
          },
          rule: true,
          fine: true,
        },
      }),

      // Violations by block (for chart)
      db.violationCase.findMany({
        include: {
          event: {
            include: {
              socket: {
                include: {
                  room: {
                    include: {
                      block: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Top 5 students with most violations (via fines -> cases)
      db.fine.groupBy({
        by: ['studentId'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),

      // Fine collection stats
      Promise.all([
        db.fine.aggregate({
          where: { paymentStatus: 'Paid' },
          _sum: { fineAmount: true },
          _count: { id: true },
        }),
        db.fine.aggregate({
          where: { paymentStatus: 'Pending' },
          _sum: { fineAmount: true },
          _count: { id: true },
        }),
      ]),
    ]);

    // Process violations by block into chart format
    const blockViolationMap: Record<string, number> = {};
    for (const violation of violationsByBlock) {
      const blockName = violation.event?.socket?.room?.block?.blockName || 'Unknown';
      blockViolationMap[blockName] = (blockViolationMap[blockName] || 0) + 1;
    }
    const violationsByBlockData = Object.entries(blockViolationMap).map(
      ([blockName, count]) => ({
        blockName,
        count,
      })
    );

    // Top students with most violations - fetch student details
    const topStudentsWithDetails = await Promise.all(
      topStudentsViolations.map(async (entry) => {
        const student = await db.student.findUnique({
          where: { id: entry.studentId },
          include: { room: { include: { block: true } } },
        });
        return {
          studentId: entry.studentId,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown',
          regNo: student?.regNo || 'N/A',
          department: student?.department || 'N/A',
          roomNumber: student?.room?.roomNumber || 'Unassigned',
          blockName: student?.room?.block?.blockName || 'N/A',
          violationCount: entry._count.id,
        };
      })
    );

    // Fine collection stats format
    const [paidStats, unpaidStats] = fineCollectionStats;

    // Power usage by day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentEvents = await db.powerEvent.findMany({
      where: {
        startTime: { gte: sevenDaysAgo },
      },
      select: {
        startTime: true,
        watts: true,
        endTime: true,
      },
      orderBy: { startTime: 'asc' },
    });

    // Group power usage by day
    const powerByDayMap: Record<string, { totalWatts: number; eventCount: number }> = {};
    for (const event of recentEvents) {
      const dayKey = new Date(event.startTime).toISOString().split('T')[0];
      const durationHours =
        event.endTime
          ? Math.max(0, (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60 * 60))
          : 1;
      const energyUsage = event.watts * durationHours;

      if (!powerByDayMap[dayKey]) {
        powerByDayMap[dayKey] = { totalWatts: 0, eventCount: 0 };
      }
      powerByDayMap[dayKey].totalWatts += energyUsage;
      powerByDayMap[dayKey].eventCount += 1;
    }

    const powerUsageByDay = Object.entries(powerByDayMap).map(
      ([date, data]) => ({
        date,
        energyWh: Math.round(data.totalWatts * 100) / 100,
        eventCount: data.eventCount,
      })
    );

    return NextResponse.json({
      counts: {
        blocks: totalBlocks,
        rooms: totalRooms,
        students: totalStudents,
        sockets: totalSockets,
        events: totalEvents,
        violations: totalViolations,
        fines: totalFines,
      },
      pendingViolations,
      unpaidFinesTotal: unpaidFines._sum.fineAmount || 0,
      recentViolations,
      violationsByBlock: violationsByBlockData,
      powerUsageByDay,
      topStudentsViolations: topStudentsWithDetails,
      fineCollection: {
        paid: {
          count: paidStats._count.id,
          totalAmount: paidStats._sum.fineAmount || 0,
        },
        unpaid: {
          count: unpaidStats._count.id,
          totalAmount: unpaidStats._sum.fineAmount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}
