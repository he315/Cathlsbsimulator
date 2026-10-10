// ---------------------------------------------------------------------------
// Full-screen cath lab layout: a header strip, the monitor bank (live,
// reference, haemodynamic monitor, dose), and the table along the bottom
// (the table strip and the table-side controls). Neutral dark, no vendor
// styling. Slots are filled by the lab (Simulator for the diagnostic lab,
// src/ui/pci/PciLab.tsx for the PCI lab); `lab` names which one it is.
// Slots for S15 (command palette, captions) are reserved: `captions` sits over
// the bottom of the live monitor, `palette` above the table strip.
//
// The layout follows the width it is given: a container query on the lab
// (Tailwind's [@container(max-width:899px)] variant), not on the window, since
// the app's sidebar takes part of the screen. From 900 px:
// the two monitors side by side with the haemodynamic and dose column on the
// right, each monitor at least 220 px wide, and the table strip beside the
// table-side controls. Below 900 px the lab scrolls: the two monitors share the
// first row, the haemodynamic and dose column runs under them across both, and
// the table-side controls sit under the table strip.
// ---------------------------------------------------------------------------

export interface LabLayoutProps {
  /** the lab filling the slots (default the diagnostic lab); written to data-lab for styling and tests */
  lab?: "diagnostic" | "pci";
  header: React.ReactNode;
  live: React.ReactNode;
  reference: React.ReactNode;
  haemo: React.ReactNode;
  dose: React.ReactNode;
  table: React.ReactNode;
  controls: React.ReactNode;
  /** the attending drawer (guided practice), shown over the dose display */
  drawer?: React.ReactNode;
  /** reserved for S15 (team command palette) */
  palette?: React.ReactNode;
  /** modal content over the whole lab (time-out, debrief) */
  modal?: React.ReactNode;
}

export default function LabLayout({ lab = "diagnostic", header, live, reference, haemo, dose, table, controls, drawer, palette, modal }: LabLayoutProps) {
  return (
    <div className="relative h-full min-h-[600px] bg-base-900 [container-type:inline-size]" data-lab={lab}>
      <div className="flex h-full flex-col [@container(max-width:899px)]:overflow-y-auto">
        <header className="flex h-11 shrink-0 items-center gap-3 overflow-x-auto border-b border-line bg-base-800 px-3">{header}</header>
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_minmax(300px,340px)] gap-1.5 p-1.5 [@container(max-width:899px)]:flex-none [@container(max-width:899px)]:grid-cols-2 [@container(max-width:899px)]:grid-rows-[minmax(240px,52cqw)_auto]">
          <section className="monitor relative min-h-0 overflow-hidden rounded-md" aria-label="Live">
            {live}
          </section>
          <section className="monitor relative flex min-h-0 flex-col overflow-hidden rounded-md" aria-label="Reference">
            {reference}
          </section>
          <div className="relative flex min-h-0 flex-col gap-1.5 [@container(max-width:899px)]:col-span-2">
            <section className="min-h-0 shrink-0" aria-label="Haemodynamics">
              {haemo}
            </section>
            <section className="relative min-h-0 flex-1 overflow-y-auto rounded-md [@container(max-width:899px)]:min-h-[260px]" aria-label="Dose">
              {dose}
            </section>
            {/* the attending drawer covers the dose display, never the haemodynamic monitor */}
            {drawer && <div className="absolute inset-x-0 bottom-0 top-[46%] z-20 flex justify-end">{drawer}</div>}
          </div>
        </div>
        {palette && <div className="shrink-0 border-t border-line bg-base-800 px-3 py-1">{palette}</div>}
        <div className="grid h-[214px] shrink-0 grid-cols-[minmax(0,1fr)_minmax(460px,560px)] gap-1.5 border-t border-line bg-base-800 p-1.5 [@container(max-width:899px)]:h-auto [@container(max-width:899px)]:grid-cols-1 [@container(max-width:899px)]:grid-rows-[200px_214px]">
          <section className="min-w-0 overflow-hidden rounded-md" aria-label="Table">
            {table}
          </section>
          <section className="panel min-h-0 overflow-hidden" aria-label="Table-side controls">
            {controls}
          </section>
        </div>
      </div>
      {modal && <div className="absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-black/60 p-6">{modal}</div>}
    </div>
  );
}
