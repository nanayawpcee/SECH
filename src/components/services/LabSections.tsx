import "@/styles/lab-sections.css";
import Image from "next/image";
import { Activity, Dna, Droplet, Droplets, FlaskConical, Microscope, ShieldPlus, type LucideIcon } from "lucide-react";
import { LAB_EXTRAS, LAB_SECTIONS } from "@/lib/data";
import { HashHighlight } from "@/components/ui/HashHighlight";

/** Stand-in icons for sections that don't have a photo yet. */
const ICONS: Record<string, LucideIcon> = {
  haematology: Droplet,
  microbiology: Microscope,
  biochemistry: FlaskConical,
  transfusion: Droplets,
  "molecular-biology": Dna,
  endocrinology: Activity,
  immunology: ShieldPlus,
};

/**
 * The laboratory's sections on /services/laboratory. Each card has an id, so
 * the Laboratory links on the Services page ("Biochemistry" and so on) open
 * the page at that section.
 */
export function LabSections() {
  return (
    <section className="lab-sections" aria-labelledby="lab-sections-title">
      <HashHighlight />
      <div className="lab-sections-inner">
        <div className="section-tag"><span>Inside the Laboratory</span></div>
        <h2 id="lab-sections-title" className="section-heading">Our laboratory sections</h2>

        <div className="lab-grid">
          {LAB_SECTIONS.map((s) => {
            const Icon = ICONS[s.id] ?? FlaskConical;
            return (
              <article key={s.id} id={s.id} className="lab-card">
                <div className="lab-photo">
                  {s.image ? (
                    <Image src={s.image} alt={s.imageAlt ?? s.name} fill sizes="(max-width: 640px) 100vw, 380px" style={{ objectFit: "cover" }} />
                  ) : (
                    <div className="lab-icon" aria-hidden="true"><Icon size={34} strokeWidth={1.6} /></div>
                  )}
                </div>
                <div className="lab-body">
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                </div>
              </article>
            );
          })}
        </div>

        {LAB_EXTRAS.length > 0 && (
          <div className="lab-extras">
            <span className="lab-extras-label">Also in the laboratory</span>
            {LAB_EXTRAS.map((x) => {
              const Icon = ICONS[x.id] ?? FlaskConical;
              return (
                <div key={x.id} id={x.id} className="lab-extra">
                  <span className="lab-extra-icon" aria-hidden="true"><Icon size={20} /></span>
                  <div>
                    <h3>{x.name}</h3>
                    <p>{x.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
