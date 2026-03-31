import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data (order matters due to foreign keys)
  await prisma.fine.deleteMany();
  await prisma.violationCase.deleteMany();
  await prisma.powerEvent.deleteMany();
  await prisma.loadRule.deleteMany();
  await prisma.warden.deleteMany();
  await prisma.socket.deleteMany();
  await prisma.student.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hostelBlock.deleteMany();

  // Hostel Blocks
  const blocks = await Promise.all([
    prisma.hostelBlock.create({ data: { blockName: 'A Block', genderType: 'Boys', totalFloors: 5 } }),
    prisma.hostelBlock.create({ data: { blockName: 'B Block', genderType: 'Boys', totalFloors: 4 } }),
    prisma.hostelBlock.create({ data: { blockName: 'C Block', genderType: 'Girls', totalFloors: 5 } }),
    prisma.hostelBlock.create({ data: { blockName: 'D Block', genderType: 'Girls', totalFloors: 3 } }),
  ]);

  // Rooms
  const rooms = [];
  for (const block of blocks) {
    for (let floor = 1; floor <= block.totalFloors; floor++) {
      for (let r = 1; r <= 4; r++) {
        const roomType = r <= 2 ? 'Double' : 'Triple';
        const capacity = roomType === 'Double' ? 2 : 3;
        rooms.push(
          await prisma.room.create({
            data: {
              roomNumber: `${block.blockName.charAt(0)}${floor}${String(r).padStart(2, '0')}`,
              floorNo: floor,
              roomType,
              capacity,
              blockId: block.id,
            },
          })
        );
      }
    }
  }

  // Students
  const depts = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AI&DS', 'BME'];
  const firstNames = ['Krithika', 'Kishal', 'Tharun', 'Raghav', 'Mano', 'Kumar', 'Divya', 'Karthik', 'Meera', 'Surya', 'Ananya', 'Deepak', 'Nithya', 'Varun', 'Lakshmi', 'Aditya', 'Kavitha', 'Suresh', 'Ritu', 'Manoj'];
  const lastNames = ['P', 'Kumar', 'S', 'R', 'L', 'Sharma', 'Iyer', 'Rao', 'Patel', 'Das', 'Singh', 'Verma', 'Gupta', 'Reddy', 'Chopra', 'Malhotra', 'Bhat', 'Menon', 'Pillai', 'Dutta'];

  const students = [];
  for (let i = 0; i < 60; i++) {
    const room = rooms[i % rooms.length];
    students.push(
      await prisma.student.create({
        data: {
          regNo: `24${depts[i % depts.length].slice(0, 2)}${String(1112 + i).padStart(4, '0')}`,
          firstName: firstNames[i % firstNames.length],
          lastName: lastNames[i % lastNames.length],
          department: depts[i % depts.length],
          yearOfStudy: (i % 4) + 1,
          phoneNo: `98${String(Math.floor(Math.random() * 900000000 + 100000000))}`,
          roomId: room.id,
        },
      })
    );
  }

  // Sockets
  const sockets = [];
  for (const room of rooms) {
    const socketCount = room.capacity === 2 ? 2 : 3;
    for (let s = 1; s <= socketCount; s++) {
      sockets.push(
        await prisma.socket.create({
          data: {
            socketLabel: `S${s}`,
            socketType: s === 1 ? 'Heavy Load' : 'Normal',
            socketStatus: Math.random() > 0.1 ? 'Active' : 'Under Maintenance',
            roomId: room.id,
          },
        })
      );
    }
  }

  // Load Rules
  const rules = await Promise.all([
    prisma.loadRule.create({ data: { ruleName: 'High Watt Threshold', maxWatts: 1500, maxDurationMinutes: 20, severityLevel: 'High', isActive: true } }),
    prisma.loadRule.create({ data: { ruleName: 'Extended Usage', maxWatts: 800, maxDurationMinutes: 120, severityLevel: 'Medium', isActive: true } }),
    prisma.loadRule.create({ data: { ruleName: 'Night Usage Restriction', maxWatts: 500, maxDurationMinutes: 30, severityLevel: 'Low', isActive: true } }),
    prisma.loadRule.create({ data: { ruleName: 'Heating Appliance Ban', maxWatts: 1000, maxDurationMinutes: 10, severityLevel: 'High', isActive: true } }),
    prisma.loadRule.create({ data: { ruleName: 'Cooking Appliance Check', maxWatts: 1200, maxDurationMinutes: 15, severityLevel: 'High', isActive: true } }),
  ]);

  // Wardens
  const wardens = await Promise.all([
    prisma.warden.create({ data: { firstName: 'Ravi', lastName: 'Kumar', phoneNo: '9998887770', email: 'ravi.kumar@warden.vit.ac.in', blockId: blocks[0].id } }),
    prisma.warden.create({ data: { firstName: 'Sunitha', lastName: 'Raj', phoneNo: '9998887771', email: 'sunitha.raj@warden.vit.ac.in', blockId: blocks[1].id } }),
    prisma.warden.create({ data: { firstName: 'Mohammed', lastName: 'Ali', phoneNo: '9998887772', email: 'mohammed.ali@warden.vit.ac.in', blockId: blocks[2].id } }),
    prisma.warden.create({ data: { firstName: 'Lakshmi', lastName: 'Devi', phoneNo: '9998887773', email: 'lakshmi.devi@warden.vit.ac.in', blockId: blocks[3].id } }),
  ]);

  // Power Events
  const now = new Date();
  const events = [];
  const sources = ['Manual', 'Sensor', 'Simulated'];

  for (let i = 0; i < 120; i++) {
    const socket = sockets[i % sockets.length];
    const watts = [200, 450, 800, 1200, 1800, 2200, 600, 1000, 350, 1500][i % 10];
    const startOffset = Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000;
    const durationMs = (Math.floor(Math.random() * 120) + 5) * 60 * 1000;
    const startTime = new Date(now.getTime() - startOffset);
    const endTime = new Date(startTime.getTime() + durationMs);

    events.push(
      await prisma.powerEvent.create({
        data: {
          socketId: socket.id,
          startTime,
          endTime,
          watts,
          eventSource: sources[i % 3],
        },
      })
    );
  }

  // Violation Cases
  const caseStatuses = ['Pending', 'Confirmed', 'Cleared'];
  const violationReasons = [
    'Exceeded watt limit',
    'Exceeded duration limit',
    'Both watt and duration exceeded',
    'Unauthorized appliance detected',
    'Night-time heavy usage',
  ];
  const violations = [];

  for (let i = 0; i < 45; i++) {
    const event = events[i];
    const rule = rules[i % rules.length];
    const violation = await prisma.violationCase.create({
      data: {
        eventId: event.id,
        ruleId: rule.id,
        detectedTime: new Date(event.endTime.getTime() + 5 * 60 * 1000),
        violationReason: violationReasons[i % violationReasons.length],
        caseStatus: caseStatuses[i % 3],
      },
    });
    violations.push(violation);
  }

  // Fines
  const paymentStatuses = ['Pending', 'Paid', 'Overdue'];
  for (let i = 0; i < 25; i++) {
    const violation = violations[i];
    const student = students[i % students.length];
    const warden = wardens[i % wardens.length];
    const fineAmount = [200, 500, 300, 750, 1000, 250, 400, 600][i % 8];
    const issuedDate = new Date(violation.detectedTime.getTime() + 24 * 60 * 60 * 1000);
    const dueDate = new Date(issuedDate.getTime() + 7 * 24 * 60 * 60 * 1000);

    await prisma.fine.create({
      data: {
        caseId: violation.id,
        studentId: student.id,
        wardenId: warden.id,
        fineAmount,
        issuedDate,
        dueDate,
        paymentStatus: paymentStatuses[i % 3],
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log(`- ${blocks.length} hostel blocks`);
  console.log(`- ${rooms.length} rooms`);
  console.log(`- ${students.length} students`);
  console.log(`- ${sockets.length} sockets`);
  console.log(`- ${rules.length} load rules`);
  console.log(`- ${wardens.length} wardens`);
  console.log(`- ${events.length} power events`);
  console.log(`- ${violations.length} violation cases`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

