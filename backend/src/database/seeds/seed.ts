import { AppDataSource } from '../data-source';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';
import { Importer } from '../../importers/entities/importer.entity';
import { WorkflowStep } from '../../workflow/entities/workflow-step.entity';
import * as bcrypt from 'bcrypt';

const WORKFLOW_STEPS: Partial<WorkflowStep>[] = [
  { id: 's1',  sortOrder: 1,  title: 'Receive Documents',           phase: 0, statusLabel: 'Documents Received',          hasRemarks: true,  dropdown: false, uploads: ['Invoice','Packing List','Bill of Lading','Certificate of Origin','Proforma Invoice','Letter of Credit','Insurance','VAT','IRC','Other Documents'] },
  { id: 's2',  sortOrder: 2,  title: 'Vetting',                     phase: 0, statusLabel: 'Vetting Complete',             hasRemarks: true,  dropdown: false, checks: ['Bank Endorsement Verified','Documents Complete','Corrections Required'] },
  { id: 's5',  sortOrder: 3,  title: 'IGM Verification',            phase: 0, statusLabel: 'IGM Verified',                hasRemarks: true,  dropdown: false, checks: ['BL Verified','Rotation Verified','Arrival Verified','Container Verified'] },
  { id: 's3',  sortOrder: 4,  title: 'ASYCUDA Data Entry',          phase: 0, statusLabel: 'Entered into ASYCUDA',        hasRemarks: true,  dropdown: false, note: 'Tracking only — complete the data entry inside ASYCUDA World, then record it here.', checks: ['Data Entry Completed'], fields: [{ label: 'Entry Date', key: 'entrydate', type: 'date' }] },
  { id: 's4',  sortOrder: 5,  title: 'Upload ASYCUDA Declaration',  phase: 0, statusLabel: 'Declaration Uploaded',        hasRemarks: true,  dropdown: false, uploads: ['Declaration (PDF / XML)'] },
  { id: 's6',  sortOrder: 6,  title: 'C Number Mapping',            phase: 1, statusLabel: 'C Number Generated',          hasRemarks: true,  dropdown: false, special: 'cnumber', fields: [{ label: 'C Number', key: 'cnumber', ph: 'C-2026-00000' },{ label: 'Declaration Date', key: 'decldate', type: 'date' }] },
  { id: 's7',  sortOrder: 7,  title: 'Officer Information',         phase: 1, statusLabel: 'Officer Assigned',            hasRemarks: true,  dropdown: false, fields: [{ label: 'Section', key: 'section', ph: 'Section 4B' },{ label: 'Assistant Revenue Officer', key: 'aro', ph: 'ARO name' },{ label: 'Revenue Officer', key: 'ro', ph: 'RO name' }] },
  { id: 's8',  sortOrder: 8,  title: 'Channel Selection',           phase: 1, statusLabel: 'Channel Assigned',            hasRemarks: true,  dropdown: true,  special: 'channel' },
  { id: 's9',  sortOrder: 9,  title: 'Examination Opening',         phase: 2, statusLabel: 'Examination Opened',          hasRemarks: true,  dropdown: false, channels: ['red','yellow'], fields: [{ label: 'Opening Date', key: 'openingdate', type: 'date' }] },
  { id: 's10', sortOrder: 10, title: 'Physical Examination',        phase: 2, statusLabel: 'Physical Examination Complete', hasRemarks: true, dropdown: false, channels: ['red','yellow'], uploads: ['Examination Report','Supporting Images'] },
  { id: 's22', sortOrder: 11, title: 'Online Report Submission',    phase: 2, statusLabel: 'Report Submitted Online',     hasRemarks: true,  dropdown: false, channels: ['red','yellow'], uploads: ['Online Report'] },
  { id: 's23', sortOrder: 12, title: 'Red Cut by DC',               phase: 2, statusLabel: 'Red Cut Approved by DC',     hasRemarks: true,  dropdown: false, channels: ['red'], checks: ['Red Cut Approved by DC'] },
  { id: 's11', sortOrder: 13, title: 'Appraisal',                   phase: 2, statusLabel: 'Appraisal Complete',          hasRemarks: true,  dropdown: false, channels: ['yellow','red'], uploads: ['Jetty Report'], fields: [{ label: 'HS Code', key: 'hscode', ph: '0000.00.00' },{ label: 'Declared Value', key: 'declared', ph: '$0.00' },{ label: 'Appraised Value', key: 'appraised', ph: '$0.00' }] },
  { id: 's12', sortOrder: 14, title: 'RO Review',                   phase: 2, statusLabel: 'RO Review Complete',          hasRemarks: true,  dropdown: false, channels: ['yellow','red'], checks: ['Compliance Verified','Reload to Green Channel'], buttonLabel: 'Approve & Continue' },
  { id: 's13', sortOrder: 15, title: 'Assessment Notice',           phase: 3, statusLabel: 'Assessment Complete',         hasRemarks: true,  dropdown: false, uploads: ['Signed Assessment Notice'] },
  { id: 's14', sortOrder: 16, title: 'Duty Payment',                phase: 3, statusLabel: 'Duty Paid',                  hasRemarks: true,  dropdown: false, checks: ['Duty Payment Confirmed'], uploads: ['Treasury Challan / Payment Slip'] },
  { id: 's15', sortOrder: 17, title: 'Prepare Five Document Sets',  phase: 3, statusLabel: 'Ready for Submission',        hasRemarks: true,  dropdown: false, uploads: ['Outpass Set','Office Set','D/O Set','Importer Set','Delivery Set'] },
  { id: 's16', sortOrder: 18, title: 'Submit Outpass',              phase: 3, statusLabel: 'Outpass Submitted',           hasRemarks: true,  dropdown: false, uploads: ['Signed Outpass'], fields: [{ label: 'Submission Date', key: 'subdate', type: 'date' },{ label: 'Section Room', key: 'sectionroom', ph: 'Room 204' }] },
  { id: 's24', sortOrder: 19, title: 'DO Collection',               phase: 3, statusLabel: 'D/O Collected',              hasRemarks: true,  dropdown: false, uploads: ['Delivery Order (D/O)'], checks: ['D/O Collected'] },
  { id: 's17', sortOrder: 20, title: 'Handover to Jetty Sarkar',    phase: 3, statusLabel: 'Cargo Handed Over',           hasRemarks: true,  dropdown: false, fields: [{ label: 'Handover Date', key: 'handoverdate', type: 'date' }] },
  { id: 's18', sortOrder: 21, title: 'One Stop Verification',       phase: 3, statusLabel: 'One Stop Verified',           hasRemarks: true,  dropdown: false, checks: ['One Stop Verification Complete'] },
  { id: 's19', sortOrder: 22, title: 'Unstuffing',                  phase: 3, statusLabel: 'Unstuffing Complete',         hasRemarks: true,  dropdown: false, checks: ['Container Unstuffed'] },
  { id: 's20', sortOrder: 23, title: 'Delivery Complete',           phase: 3, statusLabel: 'Delivered',                  hasRemarks: true,  dropdown: false, fields: [{ label: 'Delivery Date', key: 'deldate', type: 'date' },{ label: 'Receiver Name', key: 'receiver', ph: 'Receiver' }] },
  { id: 's21', sortOrder: 24, title: 'Payment Receipt',             phase: 3, statusLabel: 'Payment Completed',           hasRemarks: true,  dropdown: false, uploads: ['Payment Receipt'], fields: [{ label: 'Receipt Number', key: 'receiptno', ph: 'RCP-0000' },{ label: 'Payment Date', key: 'paymentdate', type: 'date' },{ label: 'Amount', key: 'amount', ph: '৳ 0.00' }] },
];

const IMPORTERS = [
  'ACME Trading Co.',
  'Global Imports Ltd.',
  'Pacific Rim Traders',
  'Eastern Star Imports',
  'Continental Goods Inc.',
  'Atlantic Trade Partners',
  'Metro Commercial Corp.',
  'Summit Enterprises',
];

async function seed() {
  await AppDataSource.initialize();
  console.log('Seeding database...');

  // Seed workflow steps — delete all and re-insert to ensure correct data
  const stepRepo = AppDataSource.getRepository(WorkflowStep);
  await stepRepo.createQueryBuilder().delete().from(WorkflowStep).execute();
  await stepRepo.save(WORKFLOW_STEPS);
  console.log(`Seeded ${WORKFLOW_STEPS.length} workflow steps`);

  // Seed importers
  const importerRepo = AppDataSource.getRepository(Importer);
  for (const name of IMPORTERS) {
    const existing = await importerRepo.findOne({ where: { name } });
    if (!existing) {
      await importerRepo.save({ name });
    }
  }
  console.log(`Seeded ${IMPORTERS.length} importers`);

  // Seed admin user
  const userRepo = AppDataSource.getRepository(User);
  const adminEmail = 'admin@clearport.com';
  const existing = await userRepo.findOne({ where: { email: adminEmail } });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin123', 12);
    await userRepo.save({
      name: 'System Admin',
      email: adminEmail,
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    console.log('Seeded admin user: admin@clearport.com / admin123');
  }

  console.log('Seed complete!');
  await AppDataSource.destroy();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
