import { WorkflowStep } from '@/types';

export function defaultWorkflow(): WorkflowStep[] {
  return [
    { id: 's1', title: 'Receive Documents', phase: 0, status: 'Documents Received', uploads: ['Invoice', 'Packing List', 'Bill of Lading', 'Certificate of Origin', 'Proforma Invoice', 'Letter of Credit', 'Insurance', 'VAT', 'IRC', 'Other Documents'], hasRemarks: true },
    { id: 's2', title: 'Vetting', phase: 0, status: 'Vetting Complete', checks: ['Bank Endorsement Verified', 'Documents Complete', 'Corrections Required'], hasRemarks: true },
    { id: 's5', title: 'IGM Verification', phase: 0, status: 'IGM Verified', checks: ['BL Verified', 'Rotation Verified', 'Arrival Verified', 'Container Verified'], hasRemarks: true },
    { id: 's3', title: 'ASYCUDA Data Entry', phase: 0, status: 'Entered into ASYCUDA', note: 'Tracking only — complete the data entry inside ASYCUDA World, then record it here.', checks: ['Data Entry Completed'], fields: [{ label: 'Entry Date', key: 'entrydate', type: 'date' }], hasRemarks: true },
    { id: 's4', title: 'Upload ASYCUDA Declaration', phase: 0, status: 'Declaration Uploaded', uploads: ['Declaration (PDF / XML)'], hasRemarks: true },
    { id: 's6', title: 'C Number Mapping', phase: 1, status: 'C Number Generated', special: 'cnumber', fields: [{ label: 'C Number', key: 'cnumber', ph: 'C-2026-00000' }, { label: 'Declaration Date', key: 'decldate', type: 'date' }], hasRemarks: true },
    { id: 's7', title: 'Officer Information', phase: 1, status: 'Officer Assigned', fields: [{ label: 'Section', key: 'section', ph: 'Section 4B' }, { label: 'Assistant Revenue Officer', key: 'aro', ph: 'ARO name' }, { label: 'Revenue Officer', key: 'ro', ph: 'RO name' }], hasRemarks: true },
    { id: 's8', title: 'Channel Selection', phase: 1, status: 'Channel Assigned', special: 'channel', dropdown: true, hasRemarks: true },
    { id: 's9', title: 'Examination Opening', phase: 2, status: 'Examination Opened', channels: ['red', 'yellow'], fields: [{ label: 'Opening Date', key: 'openingdate', type: 'date' }], hasRemarks: true },
    { id: 's10', title: 'Physical Examination', phase: 2, status: 'Physical Examination Complete', channels: ['red', 'yellow'], uploads: ['Examination Report', 'Supporting Images'], hasRemarks: true },
    { id: 's22', title: 'Online Report Submission', phase: 2, status: 'Report Submitted Online', channels: ['red', 'yellow'], uploads: ['Online Report'], hasRemarks: true },
    { id: 's23', title: 'Red Cut by DC', phase: 2, status: 'Red Cut Approved by DC', channels: ['red'], checks: ['Red Cut Approved by DC'], hasRemarks: true },
    { id: 's11', title: 'Appraisal', phase: 2, status: 'Appraisal Complete', channels: ['yellow', 'red'], fields: [{ label: 'HS Code', key: 'hscode', ph: '0000.00.00' }, { label: 'Declared Value', key: 'declared', ph: '$0.00' }, { label: 'Appraised Value', key: 'appraised', ph: '$0.00' }], uploads: ['Jetty Report'], hasRemarks: true },
    { id: 's12', title: 'RO Review', phase: 2, status: 'RO Review Complete', channels: ['yellow', 'red'], checks: ['Compliance Verified', 'Reload to Green Channel'], hasRemarks: true, button: 'Approve & Continue' },
    { id: 's13', title: 'Assessment Notice', phase: 3, status: 'Assessment Complete', uploads: ['Signed Assessment Notice'], hasRemarks: true },
    { id: 's14', title: 'Duty Payment', phase: 3, status: 'Duty Paid', checks: ['Duty Payment Confirmed'], uploads: ['Treasury Challan / Payment Slip'], hasRemarks: true },
    { id: 's15', title: 'Prepare Five Document Sets', phase: 3, status: 'Ready for Submission', uploads: ['Outpass Set', 'Office Set', 'D/O Set', 'Importer Set', 'Delivery Set'], hasRemarks: true },
    { id: 's16', title: 'Submit Outpass', phase: 3, status: 'Outpass Submitted', uploads: ['Signed Outpass'], fields: [{ label: 'Submission Date', key: 'subdate', type: 'date' }, { label: 'Section Room', key: 'sectionroom', ph: 'Room 204' }], hasRemarks: true },
    { id: 's24', title: 'DO Collection', phase: 3, status: 'D/O Collected', uploads: ['Delivery Order (D/O)'], checks: ['D/O Collected'], hasRemarks: true },
    { id: 's17', title: 'Handover to Jetty Sarkar', phase: 3, status: 'Cargo Handed Over', fields: [{ label: 'Handover Date', key: 'handoverdate', type: 'date' }], hasRemarks: true },
    { id: 's18', title: 'One Stop Verification', phase: 3, status: 'One Stop Verified', checks: ['One Stop Verification Complete'], hasRemarks: true },
    { id: 's19', title: 'Unstuffing', phase: 3, status: 'Unstuffing Complete', checks: ['Container Unstuffed'], hasRemarks: true },
    { id: 's20', title: 'Delivery Complete', phase: 3, status: 'Delivered', fields: [{ label: 'Delivery Date', key: 'deldate', type: 'date' }, { label: 'Receiver Name', key: 'receiver', ph: 'Receiver' }], hasRemarks: true },
    { id: 's21', title: 'Payment Receipt', phase: 3, status: 'Payment Completed', uploads: ['Payment Receipt'], fields: [{ label: 'Receipt Number', key: 'receiptno', ph: 'RCP-0000' }, { label: 'Payment Date', key: 'paymentdate', type: 'date' }, { label: 'Amount', key: 'amount', ph: '৳ 0.00' }], hasRemarks: true },
  ];
}

export function applies(def: WorkflowStep, channel: string): boolean {
  if (!def.channels || def.channels.length === 0) return true;
  if (!channel) return true;
  return def.channels.includes(channel);
}

export function nextApplicable(workflow: WorkflowStep[], channel: string, from: number): number {
  for (let i = from; i < workflow.length; i++) {
    if (applies(workflow[i], channel)) return i;
  }
  return workflow.length;
}

export function totalApplicable(workflow: WorkflowStep[], channel: string): number {
  return workflow.filter(d => applies(d, channel)).length;
}

export function isCompleted(c: { currentStep: number }, workflowLength: number): boolean {
  return c.currentStep >= workflowLength;
}

export function progressOf(workflow: WorkflowStep[], c: { currentStep: number; channel: string }): number {
  const total = Math.max(1, totalApplicable(workflow, c.channel));
  const done = workflow.filter((d, i) => applies(d, c.channel) && i < c.currentStep).length;
  return Math.round(done / total * 100);
}

export function statusOf(workflow: WorkflowStep[], c: { currentStep: number; channel: string }): string {
  if (isCompleted(c, workflow.length)) return 'Completed';
  if (c.currentStep === 0) return 'New Case';
  for (let i = Math.min(c.currentStep - 1, workflow.length - 1); i >= 0; i--) {
    if (applies(workflow[i], c.channel)) return workflow[i].status || workflow[i].title;
  }
  return 'New Case';
}

export function phaseIndexOf(workflow: WorkflowStep[], c: { currentStep: number }): number {
  if (isCompleted(c, workflow.length)) return 3;
  if (c.currentStep <= 0) return workflow.length ? workflow[0].phase : 0;
  const i = Math.min(c.currentStep, workflow.length - 1);
  return workflow[i].phase;
}
