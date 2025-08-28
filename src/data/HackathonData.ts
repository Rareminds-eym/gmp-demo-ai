export interface Question {
  id: number;
  caseFile: string;
  violationOptions: string[];
  correctViolation: string;
  rootCauseOptions: string[];
  correctRootCause: string;
  solutionOptions: string[];
  correctSolution: string;
}

export const hackathonData: Question[] = [
  {
    "id": 1,
    "caseFile": "During Paracetamol 500 mg tablet production, the compression machine stopped after ~45% of the batch. The hopper lid was not closed properly, so the blend sat uncovered ~30 minutes before restart. The line log shows no downtime product protection entry. In‑process weight checks right after restart show wider variation than earlier samples. Environmental differential pressure dipped once during the stoppage. What should the production and QA teams record and consider for this lot?",
    "violationOptions": [
      "Preventive maintenance not done as per schedule",
      "Cleaning done with wrong detergent",
      "Use of expired raw materials",
      "Primary packaging stored in open area"
    ],
    "correctViolation": "Preventive maintenance not done as per schedule",
    "rootCauseOptions": [
      "Faulty motor sensor not replaced on time",
      "Wrong label artwork received from vendor",
      "QC analyst used wrong reference standard",
      "Weighing balance drift in warehouse"
    ],
    "correctRootCause": "Faulty motor sensor not replaced on time",
    "solutionOptions": [
      "Replace the sensor, update maintenance plan, train operators on downtime handling and covering of product",
      "Reject all future batches of this product",
      "Run machine faster to catch up lost time",
      "Skip in‑process checks to save time"
    ],
    "correctSolution": "Replace the sensor, update maintenance plan, train operators on downtime handling and covering of product"
  },
  {
    "id": 2,
    "caseFile": "An antibiotic dry-blend moved straight to drying because the operator skipped wet granulation after misreading the BMR. The shift was short-staffed, and two steps on the BMR fall on a page break. Sieve analysis shows non‑uniform particle size and poor flow. The critical-step checkbox is blank for this stage. What should the team review and capture in the deviation?",
    "violationOptions": [
      "Skipping a validated manufacturing step",
      "Using a smaller FBD bag",
      "Printing labels in a different room",
      "Changing hair cover type"
    ],
    "correctViolation": "Skipping a validated manufacturing step",
    "rootCauseOptions": [
      "Unclear BMR layout; critical step not highlighted",
      "Faulty temperature probe in dryer",
      "Vendor sent different grade of API",
      "Wrong mesh used in sifter"
    ],
    "correctRootCause": "Unclear BMR layout; critical step not highlighted",
    "solutionOptions": [
      "Revise BMR with clear step numbers/visual flags; retrain operators on critical steps; add peer check before moving to next stage",
      "Proceed to compression and rely on final testing",
      "Shorten drying time in future batches",
      "Increase lubricant for better flow"
    ],
    "correctSolution": "Revise BMR with clear step numbers/visual flags; retrain operators on critical steps; add peer check before moving to next stage"
  },
  {
    "id": 3,
    "caseFile": "A vitamin capsule blend ran 60 minutes instead of 40 due to a power outage and late restart. Mixer timer logs show a gap; no hold‑time assessment was recorded. The batch record does not indicate whether the lubricant was added before or after the extra mixing. Early dissolution results look slightly slower than trend. What information belongs in the BMR and deviation file?",
    "violationOptions": [
      "Mixing beyond validated time limit",
      "Using a clean scoop without log entry",
      "Sampling at 3 locations instead of 5",
      "Recording data in blue ink"
    ],
    "correctViolation": "Mixing beyond validated time limit",
    "rootCauseOptions": [
      "No UPS/generator for mixer; no SOP for power failure handling",
      "Wrong label applied to API drum",
      "Incorrect assay method used",
      "Humidity high in dispensing room"
    ],
    "correctRootCause": "No UPS/generator for mixer; no SOP for power failure handling",
    "solutionOptions": [
      "Install backup power; add power‑loss SOP; test blend uniformity and dissolution risk; document hold time decision",
      "Reduce mixing time for all future products",
      "Bypass QA approval for restarts",
      "Blend again to 'average out' impact"
    ],
    "correctSolution": "Install backup power; add power‑loss SOP; test blend uniformity and dissolution risk; document hold time decision"
  },
  {
    "id": 4,
    "caseFile": "During packaging of an antihypertensive tablet, labels carried the previous batch number for about 2,000 packs before detection. The line clearance sheet is incomplete; the second‑person label check line is blank. Label reconciliation counts do not match the used/returned labels. Pallets from the first hour are already staged for dispatch. What must the team document about scope and traceability?",
    "violationOptions": [
      "Line clearance and label verification not done as per SOP",
      "Use of non‑sterile gloves in packing",
      "Cartons not shrink‑wrapped",
      "Use of different lot of desiccant"
    ],
    "correctViolation": "Line clearance and label verification not done as per SOP",
    "rootCauseOptions": [
      "Label reconciliation failure; second check skipped under time pressure",
      "Printer cartridge low causing faint text",
      "QC approval memo not filed",
      "Warehouse issued extra shippers"
    ],
    "correctRootCause": "Label reconciliation failure; second check skipped under time pressure",
    "solutionOptions": [
      "Stop line; segregate and destroy wrong packs; perform full line clearance; retrain staff; enforce independent double‑check and reconciliation",
      "Overwrite labels with marker pen",
      "Release packs with a market recall plan",
      "Print a correction note and insert into cartons"
    ],
    "correctSolution": "Stop line; segregate and destroy wrong packs; perform full line clearance; retrain staff; enforce independent double‑check and reconciliation"
  },
  {
    "id": 5,
    "caseFile": "For a multivitamin product, size '0' shells were loaded instead of size '00'. Half the batch was filled before anyone noticed the height mismatch at visual check. The component racks hold look‑alike boxes, and there is no barcode scan step at shell loading. Early net weight checks look acceptable because fill mass adjusted, but sealing defects appear in samples. What details should be captured about line setup and identification controls?",
    "violationOptions": [
      "Wrong component selection at line setup",
      "Using stainless steel scoop",
      "Running at slower speed",
      "Using different tray color"
    ],
    "correctViolation": "Wrong component selection at line setup",
    "rootCauseOptions": [
      "Look‑alike packaging; no barcode or second‑person verification",
      "Wrong blend potency",
      "Incorrect vacuum setting",
      "Humidity excursion in store"
    ],
    "correctRootCause": "Look‑alike packaging; no barcode or second‑person verification",
    "solutionOptions": [
      "Quarantine filled units; 100% visual check; introduce barcode verification and two‑person check at shell loading; update line setup checklist",
      "Blend more fill to adjust weight",
      "Increase tamping pins to compensate",
      "Release only bottles with correct net weight"
    ],
    "correctSolution": "Quarantine filled units; 100% visual check; introduce barcode verification and two‑person check at shell loading; update line setup checklist"
  },
  {
    "id": 6,
    "caseFile": "QC ran the tablet dissolution at 39 °C instead of 37 ± 0.5 °C. The bath probe daily verification entry is missing, and the control chart shows mild drift for a week. Results are out‑of‑trend versus prior lots. The analyst realized the error only after reviewing the raw data post‑run. What documents and records belong with this deviation?",
    "violationOptions": [
      "Analyst did not verify bath temperature before run",
      "Samples not vortexed for 10 seconds",
      "Using Class A glassware",
      "Recording observations every 5 minutes"
    ],
    "correctViolation": "Analyst did not verify bath temperature before run",
    "rootCauseOptions": [
      "Temperature probe drift; no daily verification log",
      "Impeller blade worn out",
      "Incorrect medium volume printed",
      "Filter interaction with API"
    ],
    "correctRootCause": "Temperature probe drift; no daily verification log",
    "solutionOptions": [
      "Calibrate/replace probe; add pre‑run temperature verification step; invalidate results and repeat; retrain analysts",
      "Adjust results mathematically for temperature",
      "Accept results as they are since close",
      "Change dissolution method permanently"
    ],
    "correctSolution": "Calibrate/replace probe; add pre‑run temperature verification step; invalidate results and repeat; retrain analysts"
  },
  {
    "id": 7,
    "caseFile": "A cough‑syrup assay used a titrant beyond expiry. The shelf tag is handwritten and faint; the reagent cabinet has no expired‑stock segregation shelf. Initial assay results looked normal, so the batch record was signed before the error was found during review. What receiving, storage, and inventory details should be written into the case file?",
    "violationOptions": [
      "Use of expired analytical reagent",
      "Using amber glassware",
      "Triplicate injections instead of duplicate",
      "Using class F weights"
    ],
    "correctViolation": "Use of expired analytical reagent",
    "rootCauseOptions": [
      "Inventory control failure; no expiry alerts; expired bottle not segregated",
      "Balance not leveled",
      "Wrong calculation factor used",
      "Analyst switched columns mid‑run"
    ],
    "correctRootCause": "Inventory control failure; no expiry alerts; expired bottle not segregated",
    "solutionOptions": [
      "Invalidate results; retest with in‑date reagent; implement electronic stock alerts; segregate expired items; 5S of reagent shelves",
      "Average results with previous batch",
      "Adjust assay by adding correction factor",
      "Skip assay and rely on dissolution only"
    ],
    "correctSolution": "Invalidate results; retest with in‑date reagent; implement electronic stock alerts; segregate expired items; 5S of reagent shelves"
  },
  {
    "id": 8,
    "caseFile": "An HPLC assay failed because the standard dilution factor was wrong. The SOP table is crowded, and the analyst copied the factor from the previous method version. There is no peer verification step for standard prep calculations. System suitability failed on response factor consistency. What should be preserved as evidence for the investigation pack?",
    "violationOptions": [
      "Deviation from SOP in standard preparation",
      "Column equilibrated for 30 minutes",
      "Mobile phase filtered and degassed",
      "System suitability run performed"
    ],
    "correctViolation": "Deviation from SOP in standard preparation",
    "rootCauseOptions": [
      "Analyst misread dilution table; no peer verification step",
      "Column end‑capped differently",
      "PDA lamp aging",
      "Autosampler misalignment"
    ],
    "correctRootCause": "Analyst misread dilution table; no peer verification step",
    "solutionOptions": [
      "Add peer verification for calculations; redesign SOP table for clarity; provide calculator template; retrain analysts",
      "Increase injection volume to fix response",
      "Change column to a newer type",
      "Shorten runtime to save time"
    ],
    "correctSolution": "Add peer verification for calculations; redesign SOP table for clarity; provide calculator template; retrain analysts"
  },
  {
    "id": 9,
    "caseFile": "Potency results varied by analyst for the same batch. Investigation shows samples were left at room temperature for hours instead of 2–8 °C as required. The label on the sample bag does not show storage condition, and the handover log between shifts is incomplete. Fridge temperature log has gaps. What should be described about sample custody and storage?",
    "violationOptions": [
      "Not following defined sample storage conditions",
      "Using 10 mL vials instead of 20 mL",
      "Labeling samples with blue ink",
      "Sampling from top only"
    ],
    "correctViolation": "Not following defined sample storage conditions",
    "rootCauseOptions": [
      "Poor handover; storage instruction not communicated; fridge log not maintained",
      "Filter lot variability",
      "Different needle gauges used",
      "Balance sensitivity limit"
    ],
    "correctRootCause": "Poor handover; storage instruction not communicated; fridge log not maintained",
    "solutionOptions": [
      "Define handover checklist; label samples with storage condition; maintain fridge logs with alarms; retrain staff; repeat testing",
      "Warm samples to room temperature before every test",
      "Increase acceptance ranges to pass",
      "Pool analyst results to average out"
    ],
    "correctSolution": "Define handover checklist; label samples with storage condition; maintain fridge logs with alarms; retrain staff; repeat testing"
  },
  {
    "id": 10,
    "caseFile": "Stability samples meant for 25 °C/60% RH spent two days at ambient. Chambers look similar; sample trays are un‑color‑coded, and the LIMS location field was left as 'TBD'. Some sample labels are smudged from condensation. No excursion assessment form was opened. What should be noted for scope identification and evidence collection?",
    "violationOptions": [
      "Placing stability samples in wrong storage condition",
      "Sampling at 0, 3, and 6 months",
      "Recording chamber ID on label",
      "Using tamper seals"
    ],
    "correctViolation": "Placing stability samples in wrong storage condition",
    "rootCauseOptions": [
      "Similar‑looking chambers; labels unclear; no location scanning",
      "Power failure in the correct chamber",
      "Excess sample pulled by QC",
      "Wrong stability protocol approved"
    ],
    "correctRootCause": "Similar‑looking chambers; labels unclear; no location scanning",
    "solutionOptions": [
      "Move samples to correct chamber; evaluate impact with excursion assessment; add barcode location control and clear signage; retrain staff",
      "Discard all stability lots",
      "Reduce study time to compensate",
      "Skip affected time points"
    ],
    "correctSolution": "Move samples to correct chamber; evaluate impact with excursion assessment; add barcode location control and clear signage; retrain staff"
  },
  {
    "id": 11,
    "caseFile": "A lactose drum arrived without any supplier label. Warehouse placed it in quarantine, but receipt was entered without a photo record or supplier contact. No ID test was requested before someone moved it to a general aisle pending 'clarification.' Later, issuance was halted by QA during a walk‑through. What receiving checkpoints and trace notes belong in the scenario record?",
    "violationOptions": [
      "Accepting unidentified material into warehouse",
      "Placing pallets 10 cm from wall",
      "Using nylon straps for pallets",
      "Recording GRN within 24 hours"
    ],
    "correctViolation": "Accepting unidentified material into warehouse",
    "rootCauseOptions": [
      "Vendor dispatch error not caught; receiving checklist incomplete",
      "Humidity excursion in dock",
      "Forklift battery low",
      "Wrong bin card color used"
    ],
    "correctRootCause": "Vendor dispatch error not caught; receiving checklist incomplete",
    "solutionOptions": [
      "Quarantine drum; reject receipt; inform vendor; strengthen vendor audits; enforce receiving checklist and photo capture",
      "Open drum and smell/visual check only",
      "Issue material to production under caution",
      "Relabel the drum manually"
    ],
    "correctSolution": "Quarantine drum; reject receipt; inform vendor; strengthen vendor audits; enforce receiving checklist and photo capture"
  },
  {
    "id": 12,
    "caseFile": "Gelatin (2–8 °C) sat at ambient for ~6 hours awaiting put‑away. The dock was busy; there is no put‑away SLA in the SOP, and shift logs do not show escalation. The delivery had three lots mixed on one pallet; carton thermometers were not used. Condensation was seen on outer cartons. What details should students capture about timing, temperatures, and lot segregation?",
    "violationOptions": [
      "Failure to store temperature‑controlled material as per requirement",
      "Using white pallet tags",
      "Weighing on 2‑decimal balance",
      "Stacking two pallets high"
    ],
    "correctViolation": "Failure to store temperature‑controlled material as per requirement",
    "rootCauseOptions": [
      "New storekeeper not trained; no visual cues; no put‑away time target",
      "Truck off‑loading delay due to rain",
      "Chiller coil frosting",
      "Delivery note missing batch number"
    ],
    "correctRootCause": "New storekeeper not trained; no visual cues; no put‑away time target",
    "solutionOptions": [
      "Move to cold room; evaluate excursion; add training, colored zone labels, put‑away SLA, and dock temperature loggers",
      "Dry the gelatin and use it",
      "Mix with other lots to dilute impact",
      "Ignore if COA meets specs"
    ],
    "correctSolution": "Move to cold room; evaluate excursion; add training, colored zone labels, put‑away SLA, and dock temperature loggers"
  },
  {
    "id": 13,
    "caseFile": "A starch drum with a torn inner liner was received and pushed to storage without QA decision. The receiving checklist lacks a damage criteria item and a photo capture step. Later, foreign specks were seen during sifting trials. What evidence and process gaps should be written up?",
    "violationOptions": [
      "Accepting physically damaged material without QA decision",
      "Not shrink‑wrapping pallets",
      "Using single‑use gloves",
      "Skipping safety shoes"
    ],
    "correctViolation": "Accepting physically damaged material without QA decision",
    "rootCauseOptions": [
      "Receiving inspection checklist not followed; no escalation to QA",
      "Forklift operator inexperienced",
      "Supplier used different liner color",
      "COA not stamped by QA"
    ],
    "correctRootCause": "Receiving inspection checklist not followed; no escalation to QA",
    "solutionOptions": [
      "Quarantine drum; inspect for contamination; take QA decision; train receiving team; add damage criteria and photo evidence in SOP",
      "Use material after sieving only",
      "Blend with intact lots",
      "Re‑bag material and proceed"
    ],
    "correctSolution": "Quarantine drum; inspect for contamination; take QA decision; train receiving team; add damage criteria and photo evidence in SOP"
  },
  {
    "id": 14,
    "caseFile": "An older API lot expired in store while newer lots were issued. Bin cards and WMS show mismatched statuses; rack labels are hard to read. No cycle count occurred last month, and the FEFO rule is not enforced in the issuance screen. Production only realized after a reconciliation audit. What stock‑rotation and system‑control facts belong in the narrative?",
    "violationOptions": [
      "Not following FEFO/FIFO during issuance",
      "Printing GRN the next day",
      "Double shrink‑wrapping pallets",
      "Using metal pallets"
    ],
    "correctViolation": "Not following FEFO/FIFO during issuance",
    "rootCauseOptions": [
      "Manual picking; no system control; poor rack labeling",
      "Unplanned overtime in warehouse",
      "API demand forecast error only",
      "QC COA attached late"
    ],
    "correctRootCause": "Manual picking; no system control; poor rack labeling",
    "solutionOptions": [
      "Implement barcode/WMS with FEFO rules; relabel racks; cycle count; train staff; investigate expired lot disposal",
      "Allow use of expired lot after testing",
      "Change expiry date in system",
      "Issue credit note to production"
    ],
    "correctSolution": "Implement barcode/WMS with FEFO rules; relabel racks; cycle count; train staff; investigate expired lot disposal"
  },
  {
    "id": 15,
    "caseFile": "The blending step was completed, but the operator signature and date are missing in the BMR. The supervisor also did not initial the page review box. A later note claims 'done at 14:30,' but no time‑stamped equipment printout is attached. What should be described about documentation timing and verification artifacts?",
    "violationOptions": [
      "Failure to complete real‑time documentation",
      "Using black ink instead of blue",
      "Writing block letters",
      "Attaching printouts with staples"
    ],
    "correctViolation": "Failure to complete real‑time documentation",
    "rootCauseOptions": [
      "High workload; no in‑process documentation check by supervisor",
      "Pen ran out of ink",
      "Wrong BMR version used",
      "Different operator handwriting"
    ],
    "correctRootCause": "High workload; no in‑process documentation check by supervisor",
    "solutionOptions": [
      "Interview operator; verify step completion with witnesses and records; add in‑process documentation check; retrain on ALCOA+ principles",
      "Sign now with today's date",
      "Ask QA to sign on behalf of operator",
      "Ignore as minor"
    ],
    "correctSolution": "Interview operator; verify step completion with witnesses and records; add in‑process documentation check; retrain on ALCOA+ principles"
  },
  {
    "id": 16,
    "caseFile": "An analyst changed a pH value in a logbook without crossing out the old entry, adding a reason, or signing and dating. The next page shows corrected calculations, but no deviation number is referenced. The reviewer noticed inconsistent handwriting pressure on the altered line. What should the case narrative include about data integrity observations?",
    "violationOptions": [
      "Non‑compliant data correction; breach of data integrity",
      "Using gel pen in logbook",
      "Writing in capital letters",
      "Attaching a post‑it note"
    ],
    "correctViolation": "Non‑compliant data correction; breach of data integrity",
    "rootCauseOptions": [
      "Analyst not trained on data correction SOP; weak review culture",
      "pH meter drifted overnight",
      "Reagent expired",
      "QC manager on leave"
    ],
    "correctRootCause": "Analyst not trained on data correction SOP; weak review culture",
    "solutionOptions": [
      "Start data integrity investigation; retrain on GMP data correction; add second‑person review; audit recent entries; strengthen culture",
      "Rewrite the whole page neatly",
      "Delete the page and re‑enter",
      "Accept the value since close to target"
    ],
    "correctSolution": "Start data integrity investigation; retrain on GMP data correction; add second‑person review; audit recent entries; strengthen culture"
  },
  {
    "id": 17,
    "caseFile": "A deviation report was submitted without root cause or CAPA fields completed. Closure was marked 'no impact' and sent for signature. The e‑form does not force those fields before submission, and there is no QA pre‑close gate. Training records show the initiator is new to deviation writing. What should be captured about documentation flow and competence?",
    "violationOptions": [
      "Submitting incomplete deviation documentation",
      "Using the old deviation template",
      "Filing deviation one day late",
      "Not attaching a photo"
    ],
    "correctViolation": "Submitting incomplete deviation documentation",
    "rootCauseOptions": [
      "Staff not trained in deviation writing; no QA gate before closure",
      "Deviation form too long",
      "Supervisor on shift change",
      "Printer out of toner"
    ],
    "correctRootCause": "Staff not trained in deviation writing; no QA gate before closure",
    "solutionOptions": [
      "Return for completion; provide training and job aids; add QA review gate; track overdue deviations and escalate",
      "Close deviation with 'no impact' note",
      "Create a new deviation for the same event",
      "Ignore missing sections if batch passed"
    ],
    "correctSolution": "Return for completion; provide training and job aids; add QA review gate; track overdue deviations and escalate"
  },
  {
    "id": 18,
    "caseFile": "Chromatography software was updated and several sequences were lost because no backup was taken. IT and QC emails show schedule confusion; the change control ticket lacks a step for pre‑update backup proof. Partial PDF printouts exist, but raw data files are missing. What should be noted about change authorization and data protection?",
    "violationOptions": [
      "Failing to back up electronic data before system change",
      "Printing fewer chromatograms",
      "Using a shorter runtime",
      "Changing column wash"
    ],
    "correctViolation": "Failing to back up electronic data before system change",
    "rootCauseOptions": [
      "No pre‑update backup SOP; IT‑QC communication gap",
      "UPS capacity low",
      "Autosampler leak",
      "CDS audit trail off"
    ],
    "correctRootCause": "No pre‑update backup SOP; IT‑QC communication gap",
    "solutionOptions": [
      "Restore from last backup; re‑run tests as needed; create mandatory pre‑change backup SOP with sign‑off; schedule joint IT‑QC changes",
      "Accept previous averages for lost data",
      "Ignore because COA is already issued",
      "Disable updates permanently"
    ],
    "correctSolution": "Restore from last backup; re‑run tests as needed; create mandatory pre‑change backup SOP with sign‑off; schedule joint IT‑QC changes"
  },
  {
    "id": 19,
    "caseFile": "Post‑cleaning swab results exceeded limits, yet production of the next batch was started without re‑cleaning or QA release. The supervisor wrote 're‑swab later' on the line board. The stop rule is vague in the cleaning SOP, and the QA check box is at the end of the batch start list, not before it. What details should be included about release steps and limits?",
    "violationOptions": [
      "Starting production without QA release after failed cleaning validation",
      "Using hot water instead of warm",
      "Skipping exterior wipe‑down",
      "Shorter drying time"
    ],
    "correctViolation": "Starting production without QA release after failed cleaning validation",
    "rootCauseOptions": [
      "Supervisor misread report; pressure to meet schedule; unclear stop rule",
      "Detergent concentration slightly low",
      "Water hardness high",
      "Swab recovery factor not applied"
    ],
    "correctRootCause": "Supervisor misread report; pressure to meet schedule; unclear stop rule",
    "solutionOptions": [
      "Stop batch; quarantine materials; re‑clean and re‑test; define clear stop rules in SOP; retrain supervisors; require QA sign‑off",
      "Blend next batch to dilute residue",
      "Proceed but test more samples later",
      "Change limit to current result"
    ],
    "correctSolution": "Stop batch; quarantine materials; re‑clean and re‑test; define clear stop rules in SOP; retrain supervisors; require QA sign‑off"
  },
  {
    "id": 20,
    "caseFile": "An in‑process pH meter carried a calibration sticker expired by 3 days. Two intermediate checks were logged using this meter. The calibration tracker spreadsheet shows the device as 'due soon,' but no alert reached the area. A backup meter exists in another room but requires a key. What context should be recorded about equipment status and access?",
    "violationOptions": [
      "Using measuring equipment past calibration due date",
      "Not cleaning probe with DI water",
      "Not wearing safety goggles",
      "Recording pH to one decimal place"
    ],
    "correctViolation": "Using measuring equipment past calibration due date",
    "rootCauseOptions": [
      "Calibration tracking system not updated; no visual alert on due date",
      "Probe junction dirty",
      "Power adapter loose",
      "Temperature not compensated"
    ],
    "correctRootCause": "Calibration tracking system not updated; no visual alert on due date",
    "solutionOptions": [
      "Quarantine affected results/batches; calibrate meter; review last valid date; implement electronic calibration tracker with alerts; retrain users",
      "Ignore because only 3 days overdue",
      "Average pH with previous runs",
      "Switch to color paper test"
    ],
    "correctSolution": "Quarantine affected results/batches; calibrate meter; review last valid date; implement electronic calibration tracker with alerts; retrain users"
  }
];