// Module eq-balloons-stents-cart: balloons, stents and the complex PCI cart (manual curriculum, track equipment).
// Sources: Brilakis, Manual of PCI, chapter 30 (introduction and Table 30.1; 30.9 balloons; 30.13 aorto-ostial
// equipment; 30.14 stents; 30.16-30.18 dissection re-entry, imaging and complication equipment; 30.19-30.23 radiation,
// support, contrast, brachytherapy and the CTO-complex PCI cart) and 9.9 (balloon expansion), with related passages in
// 8.9 (trapping), 9.7 (balloon choice and inflation), 10.1-10.2 (stent type, size and deployment), 13.3 (post-stent
// imaging), 15.1, 16.2, 18.10, 19.9, 22.2-22.3, 23.1-23.2, 25.2, 26.2, 26.4 and 27.3; Oxford Handbook of Cardiac
// Catheterization and Coronary Intervention, chapter 8 (Angioplasty balloons; Intracoronary stents; Restenosis;
// Drug-eluting stents; Bioresorbable scaffolds; Stent thrombosis; The PCI procedure; Rotational atherectomy, for the
// lithotripsy balloon) and chapter 1 (cardiac CT after stenting).
// Every claim is listed with its page in docs/curriculum/evidence/eq-balloons-stents-cart.md.
// Related modules: pm-prep-and-stent (the balloon angioplasty and stenting steps, when to stent, drug-coated balloon
// trials), cp-uncrossable and cp-calcium (the algorithms for uncrossable, undilatable and calcified lesions),
// cp-ostial (ostial technique), cp-other-complex (in-stent restenosis, stent thrombosis, vessel size), cm-perforation
// and cm-equipment-loss (using covered stents, coils and snares), eq-sheaths-guides (guide lumens and extensions).
import type { CaseStudy, Module, Reference } from "../../schema";
import type { LabTip } from "../../lab/tips";

const BOOKS = ["brilakis-manual-pci", "oxford-cath-handbook"];
const BRILAKIS = ["brilakis-manual-pci"];

const B = (loc: string) => ({ book: "brilakis-pci" as const, loc });
const O = (loc: string) => ({ book: "oxford-cath" as const, loc });

const O_BALLOONS = O("ch 8: Angioplasty balloons");
const O_STENTS = O("ch 8: Intracoronary stents");
const O_RESTENOSIS = O("ch 8: Restenosis");
const O_DES = O("ch 8: Drug-eluting stents");
const O_BRS = O("ch 8: Bioresorbable scaffolds");
const O_ST = O("ch 8: Stent thrombosis");
const O_PROC = O("ch 8: The PCI procedure");
const O_ROTA = O("ch 8: Rotational atherectomy");

export const module: Module = {
  id: "eq-balloons-stents-cart",
  title: "Balloons, stents and the complex PCI cart",
  stage: 3,
  summary:
    "The devices that dilate and scaffold the artery, and the cart that keeps the rest within reach. How a balloon catheter is built, what compliance, nominal and rated pressure mean, and the working pressures for each balloon type; the eight balloon categories, from low-profile crossing balloons to scoring, cutting, very-high-pressure, lithotripsy, drug-coated, trapping and ostial flaring balloons; how stents are made, why strut thickness and cell design matter, and how platforms differ in size range and expansion limits; how drug-eluting stents work and how they evolved, and where bioresorbable scaffolds stand; and the dedicated cart for CTO and complex PCI, with the compatibility checks that decide whether a bail-out device will actually fit.",
  objectives: [
    "Describe the parts of a balloon catheter, define compliance, nominal pressure, rated burst pressure and crossing profile, and give the usual working pressure for each balloon type from the manuals.",
    "Choose between semi-compliant and non-compliant balloons for crossing, predilatation, post-dilatation, kissing inflations, perforation sealing and malapposition.",
    "Explain how each plaque modification balloon works (spiral scoring struts, a nitinol cage, cutting blades, a wire-alongside scoring balloon), how each must be inflated and what can go wrong with it.",
    "State what the very-high-pressure balloon, the lithotripsy balloon, drug-coated balloons, trapping balloons and the dual-balloon ostial flaring catheter are for, and their key numbers.",
    "Compare closed-cell, open-cell and coil stent designs, explain the effect of strut thickness, and check a platform's size range and labelled post-dilatation limit before choosing it.",
    "Explain the platform-polymer-drug structure of a drug-eluting stent, the difference between paclitaxel and the limus drugs, how stent generations evolved, and what the trials showed for bioresorbable scaffolds.",
    "Stock, check and use a CTO and complex PCI cart, including the guide sizes that covered stents need, the microcatheters that coils need, and snare sizes.",
  ],
  lessons: [
    // -----------------------------------------------------------------------
    {
      id: "eq-balloons-stents-cart-standard",
      title: "Standard balloons: construction, compliance, pressures and crossing profile",
      minutes: 15,
      topics: ["pci-balloon-types"],
      sources: [B("30.9"), B("9.7"), B("9.9"), B("10.2"), B("13.3"), B("16.2"), B("19.9"), B("23.1"), B("23.2"), B("26.2"), O_BALLOONS, O_PROC],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis calls the balloon the main tool for modifying plaque, and it does far more than that: it expands stents, carries drug to the vessel wall, pins equipment inside the guide and, in one design, delivers lithotripsy. Before any of the special balloons make sense you need the basic device clear: what its parts are, what happens to its diameter as you add pressure, and what decides whether it will cross. The step-by-step use of a balloon is taught in pm-prep-and-stent; this lesson is about the device itself.",
        },
        { kind: "h", text: "What a balloon catheter is made of" },
        {
          kind: "steps",
          title: "From the hub to the tip (Oxford, Angioplasty balloons)",
          items: [
            { title: "1. Hypotube and inflation port", detail: "A low-profile hypotube runs from the hub, where the inflation device connects, and carries the inflation pressure to the balloon (Oxford). If the shaft kinks or is damaged, the balloon may fail to deflate, so avoid kinking it (Brilakis 9.7.10)." },
            { title: "2. Monorail (rapid exchange) segment", detail: "Only the short distal part of the catheter runs over the wire, so balloons and stents can be swapped on a standard-length wire. Brilakis uses monorail balloons in the great majority of cases: they are simpler, need no long wire, and their stiffer shaft makes them easier to deliver. In over-the-wire balloons the wire runs the whole length; any exchange needs an exchange-length wire, and Oxford says their use is now mostly limited to CTO work." },
            { title: "3. The balloon and its markers", detail: "Radiopaque markers show where the balloon is on fluoroscopy. The low-profile crossing balloons described below have a single marker, and that marker segment is where their profile is greatest (Brilakis 23.1.1)." },
            { title: "4. The tapered tip", detail: "A chamfered nose cone that limits local trauma. Its diameter at the very tip is the lesion entry profile, the first part of the balloon catheter to meet the stenosis." },
          ],
        },
        { kind: "h", text: "Compliance: what pressure does to the diameter" },
        {
          kind: "table",
          caption: "Balloon compliance, as the two manuals describe it",
          head: ["Type", "How it behaves", "Used for", "Trade-off"],
          rows: [
            ["Compliant (Oxford)", "Keeps growing as pressure rises; at high pressure the growth becomes unpredictable", "Oxford's standard predilatation balloon", "Its size at high pressure cannot be relied on"],
            ["Semi-compliant (Oxford: 'controlled compliance')", "Grows with pressure, but more predictably at high pressure than a compliant balloon", "Crossing and predilatation; one of Brilakis's two standard balloon types, with the non-compliant one", "More flexible and easier to deliver than a non-compliant balloon (Brilakis 30.9.1)"],
            ["Non-compliant", "Barely grows as pressure rises", "Post-dilating stents (both manuals) and balloon-undilatable lesions (Brilakis)", "Harder to deliver: higher crossing profile and less flexible (Brilakis 19.9.3), but reaches high pressure with less risk of dissection or rupture"],
          ],
        },
        {
          kind: "p",
          text: "**Material decides behaviour.** Oxford notes that most balloons are made from a polyethylene polymer, and that how a balloon behaves under pressure depends on what it is made of. **The terms are used loosely.** Brilakis classifies standard balloons into semi-compliant and non-compliant (30.9.1), yet elsewhere calls the same flexible balloons 'compliant' (9.7.3, 23.1.1). Oxford keeps three classes. In practice read the device's compliance chart, which lists its diameter at each pressure, rather than relying on the label.",
        },
        {
          kind: "table",
          caption: "Two pressures printed for every balloon (Oxford)",
          head: ["Pressure", "Meaning", "What it lets you do"],
          rows: [
            ["Nominal", "The pressure at which the balloon reaches its labelled diameter (a 2.5 mm balloon at nominal pressure measures 2.5 mm)", "Tells you the balloon's true size at that pressure; above it, read the chart rather than the label"],
            ["Rated ('burst')", "The design ceiling: beyond it the balloon is not meant to be inflated and may rupture, with a risk of dissecting the vessel", "Set your own limit before you start inflating"],
          ],
        },
        {
          kind: "check",
          stem: "A non-compliant and a semi-compliant balloon, both labelled 3.0 mm, are each taken from nominal pressure to 20 atm in a resistant lesion. Which statement fits the manuals?",
          options: [
            "Both grow by the same amount, because the label refers to the same diameter",
            "The non-compliant one grows more, which is why it is used for post-dilatation",
            "The semi-compliant one grows more, so its size at high pressure must be read from its chart",
            "Neither grows above nominal pressure; extra pressure only shortens the balloon",
          ],
          answer: 2,
          explanation:
            "Compliance is how much diameter rises with pressure. A semi-compliant balloon keeps growing (predictably, unlike a fully compliant one), while a non-compliant balloon barely changes, which is exactly why it is chosen to post-dilate a stent to a known size. The label is the diameter at nominal pressure only; above it, the chart tells you the real size.",
        },
        { kind: "h", text: "Sizing the balloon" },
        {
          kind: "steps",
          title: "Diameter and length (Oxford, Balloon sizing; Brilakis 9.7.3)",
          items: [
            { title: "1. Prepare fully before the stent", detail: "Open the lesion as completely as you can before deploying a stent: Oxford warns that trying to break a resistant lesion once the stent is in can be very difficult." },
            { title: "2. Diameter: no larger than the vessel at the lesion", detail: "Oxford sets the ceiling at the vessel calibre at the target lesion. Too large a balloon risks dissection or rupture; too small a balloon leaves the lesion incompletely prepared. To test whether the lesion will expand, Brilakis matches the balloon to the distal reference diameter (1:1); for a very tight lesion he first uses small balloons of 1.5 mm or less to open the entry." },
            { title: "3. Length: shorter than the lesion", detail: "Brilakis chooses a balloon shorter than the estimated lesion length, so that the segments either side are not injured and do not then need a longer stent. Oxford adds the two ways length goes wrong: a balloon that is too short can slip to and fro across the lesion as it inflates ('melon-seeding'), and one that is too long can damage the normal wall next to the lesion." },
          ],
        },
        { kind: "h", text: "Working pressures in the manuals" },
        {
          kind: "table",
          caption: "Usual inflation pressures by balloon type and job (Brilakis; check each device's chart and instructions)",
          head: ["Balloon and job", "Pressure", "Where"],
          rows: [
            ["Non-compliant, sized 1:1 or less, predilatation", "Usually 12–20 atm; up to 20–26 atm if expansion is poor", "9.7.9"],
            ["Compliant/semi-compliant, sized 1:1 or less, predilatation", "Usually 12–14 atm", "9.7.9"],
            ["Stent deployment", "Usually 12–14 atm; if expansion is poor, longer inflations or higher pressure (up to 20 atm for semi-compliant, 26–28 atm for non-compliant balloons)", "10.2.9"],
            ["Non-compliant post-dilatation, shorter than the stent", "20 atm or more in most cases; up to 26–28 atm for underexpansion", "10.2.9"],
            ["Non-compliant for an underexpanded stent found on imaging", "Above 18 atm, sized at least to the stent diameter", "13.3.6"],
            ["Non-compliant in a balloon-undilatable lesion", "Often up to 26–28 atm, with prolonged inflation (30–60 s or more)", "23.2.2"],
            ["Calcified lesion", "20 atm or more, inflation of 1–2 minutes", "19.9.3"],
            ["Semi-compliant balloon sealing a perforation", "No more than 8–10 atm, sized to the vessel, for at least 10–15 minutes", "26.2"],
            ["Semi-compliant balloon for extensive malapposition", "Low pressure", "13.3.6"],
          ],
        },
        {
          kind: "p",
          text: "**Speed and time.** Brilakis reaches the target pressure in about 3–5 seconds and holds 10–20 seconds for an ordinary predilatation, much longer for calcium or an undilatable lesion. A falling pressure on the inflation device during a held inflation suggests the lesion (or stent) is still expanding, so keep going. Above 20 atm the risk of rupture rises (9.7.9); this is why he lists pressures over 20 atm as a cause of rupture, while describing inflations of non-compliant balloons often up to 26–28 atm in undilatable lesions and insisting you know each balloon's rated burst pressure and how much its diameter grows (23.2.2). Oxford treats the rated pressure as the limit the balloon is designed for. Put the two together: read the chart, decide your ceiling before you inflate, and when a lesion needs more than an ordinary non-compliant balloon can safely give, change to a tool built for it (next lesson) rather than pushing the same balloon further.",
        },
        { kind: "h", text: "Getting more from a standard non-compliant balloon (Brilakis 23.2.2, 19.9.3)" },
        {
          kind: "list",
          items: [
            "**Undersize slightly**, usually by about 0.5 mm, and keep the vessel-to-balloon ratio at 1:1 or less to avoid perforation.",
            "**Use a shorter balloon**, which concentrates the dilating force inside the lesion.",
            "**Cycle the pressure**: once at high pressure, dropping and raising it quickly several times may help break the lesion.",
            "**Two undersized balloons side by side**, inflated together, apply asymmetric force that sometimes expands the lesion.",
            "**One or more buddy wires** through the lesion, then a high-pressure inflation: the wires change how force reaches the wall and act as a makeshift scoring balloon.",
            "**Cover what you balloon.** Every segment ballooned should later be covered by stent, to limit restenosis from geographic miss.",
            "**Watch the withdrawal.** After high-pressure inflations (Brilakis gives above 20 atm in 9.7.12) balloons can become 'sticky' and hard to pull out, and the wire can come back with them; remove them under fluoroscopy.",
          ],
        },
        { kind: "tip", id: "pci-eqb-know-the-chart" },
        { kind: "tip", id: "pci-balloon-inflation-numbers" },
        { kind: "h", text: "Profile: what decides whether a balloon will cross" },
        {
          kind: "list",
          items: [
            "**Crossing profile** is the widest point of the catheter anywhere from the balloon's proximal end forward to its tip (Brilakis, Fig. 30.81). **Lesion entry profile** is the diameter of the very tip. A microdilation catheter Brilakis illustrates has a 1.20 × 12 mm balloon, an entry profile of 0.017 in. and a crossing profile of 0.024 in.",
            "**Where the profile peaks.** In single-marker crossing balloons the marker segment is the thickest point, so a longer balloon (20–30 mm) lets the thin front part burrow further before the marker meets the hardest segment (23.1.1).",
            "**Balloons lose their profile once inflated.** A balloon that failed to cross after an inflation can be refolded between the fingers under vacuum, but a new small balloon, or one from another manufacturer with a different tip and profile, often does better (23.1.1).",
            "**Push matters as well as size.** Rapid-exchange crossing balloons push better than their over-the-wire versions, which Brilakis puts down to the stiffer shaft; the over-the-wire version allows wire exchange and contrast injection.",
            "**Non-compliant balloons cross less well**: higher crossing profile and less flexibility (19.9.3). Brilakis prefers a non-compliant balloon for predilatation because it can post-dilate later, but accepts that it is less deliverable (9.7.3); in calcified lesions he starts with a standard balloon and escalates.",
          ],
        },
        {
          kind: "table",
          caption: "Small balloons for crossing (Brilakis 30.9.2, 23.1.1; product names omitted)",
          head: ["Device", "Key feature", "Use"],
          rows: [
            ["1.0 mm low-profile balloons", "The lowest-profile balloons available when the manual was written; one 1.0 mm balloon was the first choice in the United States", "Balloon-uncrossable lesions, first device"],
            ["0.85 mm balloon", "The lowest-profile balloon in Europe at the time", "As above"],
            ["Microdilation catheter (1.20 × 12 mm)", "Kink-resistant shaft for deliverability; hydrophilic coating; rapid-exchange and over-the-wire versions", "Uncrossable lesions; most operators prefer the rapid-exchange version for its support"],
            ["Skived-tip semi-compliant balloon", "Bevelled tip with low entry profile; can be torqued to present the tip differently", "Crossing stent struts, ballooning jailed side branches, some difficult lesions"],
            ["Small balloons in general (1.5 mm or less)", "Single marker, rapid exchange, compliant, long", "Open the entry of a very tight lesion before larger balloons; jailed side branches"],
          ],
        },
        { kind: "tip", id: "pci-unx-small-long-balloon" },
        { kind: "tip", id: "pci-eqb-standard-first" },
        {
          kind: "check",
          stem: "A 1.25 mm, 12 mm, two-marker balloon stops at the entry of a tight calcified lesion and then fails again after an inflation at the entry. Which change is most likely to help, according to Brilakis?",
          options: [
            "A new 1.0 mm single-marker balloon, 20–30 mm long, rapid exchange",
            "Re-advance the same balloon, since its profile improves after one inflation",
            "A 2.5 mm non-compliant balloon, which is stiffer and pushes harder",
            "The over-the-wire version of the same balloon, for more penetration",
          ],
          answer: 0,
          explanation:
            "Brilakis's first step is the lowest-profile small balloon available: single marker, rapid exchange and long, so the low-profile segment ahead of the central marker can enter before the bulkiest point arrives. Used balloons lose their profile, so a new one (or another manufacturer's) is better than the same balloon again. A larger balloon has a bigger profile (he lists a larger 2.5–3.0 mm rapid-exchange balloon as an alternative, sometimes inflated just proximal to the lesion to disrupt its entry, but not as the first step), and the rapid-exchange version penetrates better than the over-the-wire one.",
        },
        { kind: "h", text: "Which standard balloon for which job" },
        {
          kind: "table",
          head: ["Job", "Balloon", "Why (source)"],
          rows: [
            ["Testing whether a lesion will expand before stenting", "Non-compliant, 1:1 to the distal reference", "Full expansion of a 1:1 balloon tells you the stent will expand; good expansion should be confirmed before stenting, especially in calcium (9.7.3, 9.9)"],
            ["Post-dilating a stent", "Non-compliant, shorter than the stent", "Reaches high pressure at a predictable size; a shorter balloon stays inside the stent. Brilakis skips routine high-pressure post-dilatation when imaging already shows excellent expansion, when thrombus or plaque embolisation is a concern, or when a large jailed branch could be compromised (10.2.9)"],
            ["Kissing balloon inflation in a bifurcation", "Usually short non-compliant balloons; compliant ones can be used, but keep high pressures to a minimum", "16.2"],
            ["Sealing a perforation while you prepare the definitive fix", "Semi-compliant, sized to the vessel, no more than 8–10 atm, for at least 10–15 minutes", "Occludes flow without overstretching the vessel (26.2); the full pathway is in cm-perforation"],
            ["Extensive malapposition on imaging (Brilakis: maximum gap 400 µm or more, or 1 mm or more in length)", "Semi-compliant at low pressure", "13.3.6. The Academy's IVUS and OCT lessons, which follow the EAPCI imaging consensus, use a stricter combined rule (a gap over 0.4 mm over more than 1 mm of length); a case meeting both, such as the one below, needs treating under either"],
            ["Trapping a wire inside the guide", "Standard balloon or a dedicated trapping balloon", "Next lesson"],
          ],
        },
        {
          kind: "p",
          text: "**Two Oxford cautions on the stent's own balloon.** Deploy at no less than nominal pressure and preferably high enough to expand the whole stent. But high-pressure inflation with the stent balloon is not always wise, because its ends can overhang the stent and injure normal vessel either side; if the stent is not fully expanded, post-dilate it with a separate semi- or non-compliant balloon.",
        },
        { kind: "tip", id: "pci-eqb-postdil-which-balloon" },
        {
          kind: "check",
          stem: "OCT after stenting shows a stent that is well expanded but has a 450 µm gap between struts and wall over 3 mm, and separately a second case shows a minimum stent area well below target. Which balloons does Brilakis use?",
          options: [
            "Non-compliant above 18 atm for the gap; the same balloon again for the small area",
            "Semi-compliant at high pressure for the gap; semi-compliant again for the small area",
            "No inflation for the gap; a cutting balloon inside the stent for the small area",
            "Semi-compliant at low pressure for the gap; non-compliant above 18 atm for the area",
          ],
          answer: 3,
          explanation:
            "Malapposition (struts not touching the wall) is extensive, by Brilakis's criteria, when the gap is 400 µm or more or its length is 1 mm or more, and he corrects it with a semi-compliant balloon at low pressure: the aim is contact, not more force. Underexpansion needs force at a known size: his first step for acute underexpansion is a non-compliant balloon at least as large as the stent, above 18 atm (13.3.6). A semi-compliant balloon at high pressure gives neither a known size nor gentle contact.",
        },
        {
          kind: "pitfalls",
          items: [
            "Reading the balloon's label as its size at every pressure; above nominal, only the chart tells you the diameter.",
            "Taking an ordinary non-compliant balloon well past its rated pressure instead of changing tool.",
            "Re-using an inflated small balloon to try again at an uncrossable lesion; it has lost its profile.",
            "Expecting a non-compliant balloon to cross as easily as a semi-compliant one.",
            "Overstretching a perforated vessel with a high-pressure balloon instead of a semi-compliant balloon at 8–10 atm or less.",
            "Post-dilating with the stent's own balloon at high pressure so that its ends injure the vessel beyond the stent.",
          ],
        },
        {
          kind: "pearl",
          text: "Think of every balloon in three numbers before it leaves the packet: its profile (will it cross?), its compliance (what size will it be at the pressure I plan?) and its rated pressure (where do I stop?). Most balloon problems are one of the three forgotten.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "On the bench, inflate a semi-compliant and a non-compliant 3.0 mm balloon from nominal pressure upwards and read the diameter at each step from the compliance chart; then choose the balloon and pressure for predilatation, for post-dilating a 3.0 mm stent, and for correcting a 450 µm malapposition.",
        },
        { kind: "video", id: "4cdwZ5N3W4o", note: "Brilakis's Manual of PCI chapter video on balloons." },
        {
          kind: "keypoints",
          items: [
            "Balloon catheter: hypotube and inflation port, monorail segment, balloon with markers, tapered tip; monorail in nearly every case, over-the-wire mainly for CTO.",
            "Compliant grows unpredictably at high pressure; semi-compliant grows predictably; non-compliant barely grows, crosses less well and reaches high pressure more safely.",
            "Nominal pressure gives the labelled size; the rated pressure is the design ceiling; read the chart.",
            "Size the balloon no larger than the vessel at the lesion and shorter than the lesion; too short slips, too long injures normal wall; prepare fully before the stent.",
            "Pressures: non-compliant 12–20 atm (up to 26–28 for undilatable lesions); compliant 12–14 atm; stent deployment 12–14 atm; post-dilatation 20 atm or more in most cases; rupture risk rises above 20 atm.",
            "Crossing profile is the widest point between balloon and tip; small single-marker balloons are thickest at the marker; inflated balloons lose profile.",
            "Semi-compliant at low pressure for malapposition and at 8–10 atm or less for a perforation; non-compliant above 18 atm, at least stent-sized, for underexpansion.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-balloons-stents-cart-specialty",
      title: "Specialty balloons: scoring, cutting, very-high-pressure, lithotripsy, drug-coated, trapping and ostial",
      minutes: 16,
      topics: ["pci-balloon-types"],
      sources: [B("30.9"), B("30.13"), B("30.3"), B("8.9"), B("9.7"), B("15.1"), B("15.2"), B("19.9"), B("22.1"), B("22.2"), B("23.1"), B("23.2"), B("27.3"), O_BALLOONS, O_RESTENOSIS, O_ROTA],
      refs: [...BOOKS, "raja-opn-high-pressure-2010", "secco-opn-2019", "abdel-wahab-prepare-calc-2018", "disrupt-cad3-2020", "barbato-calcium-consensus-2023", "jeger-dcb-consensus-2020", "yeh-agent-ide-2024"],
      blocks: [
        {
          kind: "p",
          text: "Brilakis sorts balloons into eight categories: standard (semi- and non-compliant), small, plaque modification, trapping, the ostial flaring balloon, drug-coated, very-high-pressure and intracoronary lithotripsy. The first two were the last lesson. The rest each solve one problem that a standard balloon cannot, and each brings its own rules for inflation and its own way of going wrong. When and in what order to use them for calcified and undilatable lesions is taught in cp-calcium and cp-uncrossable; here you learn how each device works.",
        },
        { kind: "h", text: "Plaque modification balloons" },
        {
          kind: "p",
          text: "These balloons put focused pressure on the plaque to score or modify it, which helps it expand, and they are designed to stop the balloon sliding forwards or backwards out of the lesion as it inflates ('watermelon seeding') (Brilakis 30.9.3, 23.2.3). Brilakis describes four designs (product names omitted here).",
        },
        {
          kind: "table",
          caption: "How the four plaque modification balloons work (Brilakis 30.9.3, 9.7.9, 19.9.3, 23.2.3)",
          head: ["Design", "Construction", "Inflation", "Particular points"],
          rows: [
            ["Spiral scoring balloon", "A semi-compliant balloon wrapped by three spiral nitinol struts that score the plaque as it inflates", "No slow inflation needed", "Crosses more easily than a cutting balloon and leaves denser scoring along the plaque"],
            ["Caged balloon", "A balloon inside a nitinol cage; on inflation it forms segments of 'pillows' separated by 'grooves' along the whole lesion", "No slow inflation needed", "The raised segments press on the plaque and cause small, limited tears that let it open; the recessed segments between them keep those tears from extending"],
            ["Cutting balloon", "Blades (atherotomes) standing 0.005 in. proud of the balloon cut three or four lines through fibrocalcific plaque, so that ordinary balloons can then expand it", "Slowly, about 1 atm every 5 seconds, so the blades can come out of the balloon folds and rewrap; usually 6–8 atm, not above 12 atm (9.7.9; 23.2.3 says avoid more than 14 atm); slow deflation too", "High crossing profile; also used to release intramural haematomas after stenting, after re-entry, or in spontaneous dissection"],
            ["Wire-alongside scoring balloon", "A short monorail segment with a 0.6 mm, 5 mm long balloon next to the coronary wire; the wire is back-loaded and runs along the balloon, so inflation drives the wire into the plaque", "High pressure: nominal 25 atm, rated burst 30 atm", "Not available in the United States when the manual was written; may also help cross some balloon-uncrossable lesions"],
          ],
        },
        { kind: "tip", id: "pci-calc-cutting-slow" },
        {
          kind: "list",
          items: [
            "**Oxford on the cutting balloon.** One or more blades run along its length and incise fibrotic or calcified tissue so that later inflations succeed. The blades are sharper than a surgical scalpel: they can cut gloves and skin, and they damage the artery if the balloon is withdrawn before it has fully deflated. Forcing any balloon through a Y-connector that is screwed too tight deforms it, and cutting balloons are the most easily damaged (Brilakis 9.7.6).",
            "**Where they help.** Undilatable lesions after a standard balloon has failed (23.2.3); aorto-ostial and branch ostial lesions, where they also limit balloon movement (15.1, 15.2); watermelon seeding (9.7.9); and in-stent restenosis, where Oxford notes that balloon angioplasty with or without a cutting balloon may compact the restenotic tissue.",
            "**What they cost.** All are less deliverable than standard balloons (larger profile, less flexible) and more expensive (23.2.3), so anchor techniques or a guide extension may be needed to get them through. In the PREPARE-CALC trial, 16% of severely calcified lesions randomised to a plaque modification balloon crossed over to rotational atherectomy (19.9.1).",
            "**What goes wrong.** Loss of wire or guide position while pushing a bulky device; vessel rupture or perforation; entrapment, especially if the balloon ruptures; fracture of a cutting blade; avulsion of stent struts; and occasionally extraction of a previously placed stent while a cutting balloon is pulled back (23.2.3, 27.3.1). Cutting balloons used for intramural haematoma or spontaneous dissection carry a risk of perforation (22.1).",
          ],
        },
        { kind: "tip", id: "pci-eqb-scoring-or-cutting" },
        {
          kind: "check",
          stem: "In-stent restenosis keeps squeezing your 3.0 mm non-compliant balloon forwards out of the lesion as it inflates. Which device fits the manuals best for the next inflation?",
          options: [
            "A longer semi-compliant balloon inflated quickly to grip the lesion before it slips",
            "A spiral scoring or cutting balloon, inflated slowly in the cutting balloon's case",
            "A drug-coated balloon straight away, since the lesion is a restenosis",
            "The same balloon at a higher pressure, to drive it into the plaque",
          ],
          answer: 1,
          explanation:
            "Watermelon seeding is treated by deflating, then retrying with slower inflation, a longer balloon, a buddy wire or a plaque modification balloon, which is designed to stop the slipping; a cutting balloon must go up slowly. Fast inflation is one of the causes of slipping, not a cure. A drug-coated balloon does not prepare the lesion, and more pressure on a balloon that is already slipping injures the segments it slides into.",
        },
        { kind: "h", text: "When a non-compliant balloon is not enough" },
        {
          kind: "table",
          caption: "Very-high-pressure and lithotripsy balloons",
          head: ["Device", "What it is", "Numbers", "Sources"],
          rows: [
            ["Very-high-pressure balloon", "A specialised non-compliant balloon built for very high pressure; its twin-layer design is meant to expand evenly, without the ends 'dog-boning'", "Can deliver more than 40 atm; Brilakis usually inflates it at 30–35 atm; a 2010 four-case report gives a rated burst pressure of 35 atm. In a series of 326 undilatable lesions in which conventional non-compliant balloons had failed, it alone achieved adequate expansion in more than 90%; maximal pressures reached 45–50 atm, and 47% of lesions needed more than 40 atm. Brilakis gives a 2%–3% risk of vessel rupture; the series abstract reports coronary rupture in 3 patients (it gives 326 lesions but not the number of patients)", "Brilakis 30.9.7, 9.7.9, 19.9.7; Raja 2010; Secco 2019"],
            ["Intravascular lithotripsy balloon", "Emitters along a semi-compliant rapid-exchange balloon deliver pulses of energy at 1 Hz that crack superficial and deep calcium (Oxford); Brilakis calls them shockwaves; the regulatory trial calls them acoustic pressure waves", "Off label, operators have put the peripheral version into large coronary arteries; the smallest peripheral size is 2.5 × 40 mm. In Disrupt CAD III (431 patients, a single-arm study designed for regulatory approval), procedural success was 92.4% and OCT showed calcium fractures in 67.4% of lesions", "Brilakis 30.9.8, 23.2.9; Oxford, Rotational atherectomy section; Hill 2020"],
          ],
        },
        {
          kind: "p",
          text: "**Both manuals are dated here.** Brilakis wrote that neither device was available for coronary use in the United States in 2020 and listed them as 'future techniques' at the end of his undilatable-lesion algorithms; the coronary lithotripsy system has since been through the Disrupt CAD III study, which was designed for regulatory approval, and the 2023 EAPCI consensus on heavily calcified lesions includes lithotripsy among the tools it selects by calcium morphology and location (the comparisons between tools are taught in cp-calcium). Oxford's main limitation for lithotripsy is that the balloon may not cross a tight lesion, while calling it promising, possibly the future default for calcified and undilatable lesions, because it is easy to use. Check what your own laboratory stocks before a case: a device on the algorithm is no help if it is not on the shelf.",
        },
        { kind: "tip", id: "pci-eqb-very-high-pressure" },
        { kind: "tip", id: "pci-calc-ivl-crossing" },
        {
          kind: "check",
          stem: "A 3.5 mm non-compliant balloon keeps a waist in a calcified mid-RCA despite prolonged inflation. A colleague suggests the very-high-pressure balloon. Which statement is accurate?",
          options: [
            "It is an ordinary non-compliant balloon that is simply licensed to go to 25 atm",
            "It works by scoring the plaque with blades, so it must be inflated at 1 atm every 5 seconds",
            "It is a purpose-built non-compliant balloon used at about 30–35 atm, with a real rupture risk",
            "It removes the need to check expansion afterwards, because it never leaves a waist",
          ],
          answer: 2,
          explanation:
            "The very-high-pressure balloon is a dedicated non-compliant design that can go above 40 atm; Brilakis usually uses 30–35 atm, and in a series of 326 undilatable lesions it alone achieved adequate expansion in more than 90%, with vessel rupture quoted at 2%–3% by Brilakis (the series abstract reports rupture in 3 patients). Slow stepwise inflation belongs to the cutting balloon. Whatever opens the lesion, you still confirm full expansion before stenting.",
        },
        { kind: "h", text: "Drug-coated, trapping and ostial balloons" },
        {
          kind: "steps",
          items: [
            { title: "Drug-coated balloons", detail: "The balloon carries a drug, most often paclitaxel or sirolimus, which is released into the vessel wall when it is inflated and lowers the risk of restenosis. Brilakis lists in-stent restenosis as the commonest use, with bifurcation lesions and small vessels as others. He treats a first in-stent restenosis with a repeat drug-eluting stent once the lesion is shown to dilate well, and keeps drug-coated balloons (or brachytherapy) for restenosis that recurs (22.2.10). When he wrote, coronary drug-coated balloons were not available in the United States, although peripheral drug-coated balloons had been used off label in some large coronary vessels. That has since changed: in AGENT IDE (2024), the first US randomised trial of a coronary drug-coated balloon, a paclitaxel-coated balloon was superior to an uncoated balloon for in-stent restenosis (target lesion failure at 1 year 17.9% against 28.6%). The International DCB Consensus Group (2020) stresses that devices differ, so results with one cannot be assumed for another. The trial evidence and the decision to leave no stent are taught in pm-prep-and-stent." },
            { title: "Trapping balloons", detail: "Any standard balloon can trap a wire inside the guide so that an over-the-wire device can be withdrawn without moving the wire. Dedicated trapping balloons have no wire lumen, which makes them resist kinking and deformation and gives them a lower profile, so they can trap in smaller guides. Size it to the guide: a 6 or 7 Fr guide takes a 2.5 mm balloon, a 7 or 8 Fr guide a 3.0 mm one; length ideally 20 mm or more, since more contact pins the wire better, especially a slippery polymer-jacketed wire. For trapping, pick a monorail rather than an over-the-wire balloon: its profile is smaller and it leaves room for other devices. A used trapping balloon may be deformed and hard to pass back through the Y-connector; replace it, or use the stylet. Trapping is Brilakis's preferred way to remove a microcatheter because it keeps the wire still and needs fluoroscopy only at the start. Advance the trapping balloon beyond the distal marker of the microcatheter, usually at or near the guide's primary curve; with a short or shortened guide the balloon's shaft markers cannot be trusted to stop it entering the coronary artery. Trying to trap several devices in one guide is more likely to fail and lose the wire. A guide extension with a built-in trapping balloon (6–8 Fr) is the alternative; it works best with short (135 cm) microcatheters, since 150 cm ones are often too long to leave enough wire exposed for its balloon (8.9.2.1, 30.9.4)." },
            { title: "Dual-balloon ostial flaring catheter", detail: "Designed to flare the struts of an aorto-ostial stent that hang into the aorta against the aortic wall, which helps expansion and later re-engagement. A large, low-pressure proximal anchoring balloon (up to 14 mm, inflated with a 1 mL syringe) sits in the aorta; a higher-pressure distal balloon, 8 mm long and 3.0–4.5 mm in diameter, is inflated with an inflation device. Three markers guide it: proximal (end of the anchoring balloon, in the aorta), middle (start of the angioplasty balloon, at the ostium) and distal. The ostial technique is taught in cp-ostial (30.13.2). Brilakis also describes a second aorto-ostial device, a positioning aid rather than a balloon: a nitinol device whose self-expanding legs are advanced just beyond the guide tip, where they mark the plane of the aortic wall, stop the guide entering the vessel and line the guide tip up with the aorto-ostial plane for accurate stent placement (30.13.1)." },
          ],
        },
        { kind: "tip", id: "pci-eqb-trapping-balloon-size" },
        { kind: "tip", id: "pci-eqb-ostial-flare-markers" },
        {
          kind: "check",
          stem: "You need to trap a short wire in a 6 Fr guide to remove a low-profile microcatheter. Which balloon fits Brilakis's guidance?",
          options: [
            "A 3.0 × 12 mm over-the-wire balloon, for a firmer grip",
            "A 2.0 × 8 mm non-compliant balloon, short enough to stay in the guide",
            "A 3.5 × 15 mm balloon, so that the wire is gripped hard",
            "A 2.5 × 20 mm monorail balloon",
          ],
          answer: 3,
          explanation:
            "For a 6 or 7 Fr guide Brilakis uses a 2.5 mm trapping balloon (a 7 or 8 Fr guide takes 3.0 mm), ideally 20 mm or more long so that it grips the wire over a longer contact; monorail or dedicated trapping balloons, which have smaller profiles than over-the-wire balloons. A short 2.0 mm balloon grips poorly, and oversizing does not fit the lumen. Note that a 6 Fr guide is too small to trap over-the-wire balloons or dissection re-entry devices, but 6 Fr guides with a 0.071 in. lumen can trap low-profile microcatheters.",
        },
        {
          kind: "table",
          caption: "The eight balloon categories at a glance (Brilakis Fig. 30.78)",
          head: ["Category", "Main job", "Key rule"],
          rows: [
            ["Standard semi-compliant", "Cross and predilate", "Deliverable; size grows with pressure"],
            ["Standard non-compliant", "Test expansion, post-dilate, undilatable lesions", "Predictable size; less deliverable"],
            ["Small (1.5 mm or less)", "Cross tight lesions and jailed branches", "Lowest profile, single marker, long, new"],
            ["Plaque modification", "Score or cut a resistant lesion; stop slipping", "Bulky; cutting balloon slow and low pressure"],
            ["Trapping", "Pin a wire inside the guide", "2.5 mm for 6–7 Fr, 3.0 mm for 7–8 Fr, 20 mm or more"],
            ["Ostial flaring", "Flare aorto-ostial struts", "Proximal marker in the aorta, middle marker at the ostium"],
            ["Drug-coated", "Treat restenosis without more metal; small vessels, bifurcations", "Devices differ (no class effect); evidence in pm-prep-and-stent"],
            ["Very-high-pressure and lithotripsy", "Lesions that resist non-compliant balloons", "Purpose-built devices for force; check they can cross"],
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Inflating a cutting balloon at ordinary speed or above 12–14 atm: the blades can puncture it or catch in calcium.",
            "Withdrawing a cutting balloon before full deflation, or forcing it through a tight valve.",
            "Choosing a bulky plaque modification balloon first in a lesion you cannot cross with a standard balloon.",
            "Pulling hard on a modified balloon that has ruptured or caught in an old stent: struts can be avulsed or the stent pulled out.",
            "Planning a very-high-pressure balloon or lithotripsy for a case without confirming the lab stocks it.",
            "Trapping with a short or undersized balloon, especially over a polymer-jacketed wire.",
          ],
        },
        {
          kind: "pearl",
          text: "Ask what a specialty balloon adds that a non-compliant balloon cannot: grip and focused force (scoring and cutting), more force (very-high-pressure), a different kind of energy (lithotripsy), drug (drug-coated), or a different job altogether (trapping and flaring). If the answer is 'nothing', the standard balloon is the better device, because it is easier to deliver.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "In the calcified mid-RCA scenario, after a 1:1 non-compliant balloon leaves a waist at its rated pressure, name the next balloon you would choose and why, state how you would inflate it, and say what must be true before the stent goes in.",
        },
        { kind: "video", id: "4cdwZ5N3W4o", note: "Brilakis's Manual of PCI chapter video on balloons." },
        { kind: "video", id: "9eSeLtQXeYs", note: "Manual of PCI case 8: fracture of a scoring balloon." },
        {
          kind: "keypoints",
          items: [
            "Eight categories: standard (semi- and non-compliant), small, plaque modification, trapping, ostial flaring, drug-coated, very-high-pressure, lithotripsy.",
            "Spiral scoring balloon: three nitinol struts, lower profile than cutting; caged balloon: raised segments make small tears, recessed ones limit them; neither needs slow inflation.",
            "Cutting balloon: blades 0.005 in. high, 3–4 incisions; 1 atm per 5 s, usually 6–8 atm, not above 12 atm (or 14 atm in chapter 23); high profile; deflate fully before withdrawal.",
            "Plaque modification balloons are less deliverable and costlier; they can fracture, entrap or pull out old stent struts.",
            "Very-high-pressure balloon: capable of more than 40 atm, usually used at 30–35 atm; over 90% success in undilatable lesions; rupture risk 2%–3% (Brilakis).",
            "Lithotripsy balloon: pulses along a semi-compliant balloon crack superficial and deep calcium; the limit is crossing.",
            "Trapping balloons: 2.5 mm for 6–7 Fr, 3.0 mm for 7–8 Fr, 20 mm or longer.",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-balloons-stents-cart-stent-build",
      title: "How a stent is built: materials, cell design, struts, sizes and covered stents",
      minutes: 14,
      topics: ["eq-stent-design"],
      sources: [B("30.14"), B("30.18"), B("10.1"), B("10.2"), B("22.3"), B("18.10"), O_STENTS, O_RESTENOSIS, O_ST, O_PROC, O_BRS, O("ch 1: Cardiac CT or invasive angiography?")],
      refs: [...BOOKS, "pache-isar-stereo2-2003", "byrne-balloons-stents-scaffolds-2017", "brilakis-diva-2018", "esc-revasc-2018"],
      blocks: [
        {
          kind: "p",
          text: "A coronary stent is a metal scaffold crimped onto a balloon, expanded into the plaque and left there. Oxford's history explains its design priorities: stents began as bail-out devices to avoid emergency surgery when balloon dissection closed the artery, were then shown to reduce restenosis compared with balloon angioplasty alone, and became near-universal in elective PCI as procedural death, infarction and emergency surgery fell. A stent has to be deliverable, strong and visible all at once, and no design is best at everything.",
        },
        { kind: "h", text: "What a stent has to do, and what it is made of" },
        {
          kind: "list",
          items: [
            "**The properties designers trade against each other (Oxford):** handling and deliverability, immediate recoil, flexibility, radial strength and visibility. The final behaviour depends on both the metal and the design.",
            "**Materials:** originally 316L stainless steel, increasingly cobalt-chromium, cobalt-nickel and other alloys (Oxford).",
            "**Why scaffolding helps.** Restenosis after a balloon has three components: elastic recoil (immediate), inflammation and neointimal growth (weeks to months), and negative remodelling (months to years). Stents have largely removed recoil and negative remodelling, but the inflammatory response and the tissue that grows between the struts remain; that is the problem drug-eluting stents attack (next lesson). The restenosis numbers are taught in pm-prep-and-stent.",
            "**Delivery.** Stents come pre-mounted on monorail balloons and are sized by their expanded diameter and length. The first widely used stent had to be crimped onto a balloon by hand and not uncommonly came off it. Self-expanding stents, still used in peripheral arteries, fell out of coronary use mainly because of unacceptably high restenosis (Oxford).",
          ],
        },
        {
          kind: "table",
          caption: "Three structural designs (Oxford, Intracoronary stents)",
          head: ["Design", "How it is made", "Strengths", "Weaknesses"],
          rows: [
            ["Tubular slotted (usually closed-cell)", "Laser-cut from a metal tube; every cell is bounded by struts", "High radial strength; high metal-to-artery coverage", "Less flexible"],
            ["Modular (open-cell)", "Repeating identical units, laser-cut and joined by connecting struts at certain points", "More flexible; easier access to side branches through the cells", "Less metal coverage, especially around the articulations"],
            ["Coil", "One continuous wire coil along the whole length", "Very flexible", "Poor scaffolding and radial strength; largely superseded"],
          ],
        },
        {
          kind: "check",
          stem: "You expect to need repeated wire and balloon access to a large diagonal through the struts of an LAD stent. Which structural feature helps most, by Oxford's description?",
          options: [
            "A modular open-cell design, for its flexibility and side-branch access",
            "A closed-cell slotted-tube design, for its high radial strength",
            "A coil design, for its maximal flexibility around the bifurcation",
            "A self-expanding design, so the cells open as the vessel remodels",
          ],
          answer: 0,
          explanation:
            "Open-cell modular stents have less metal between linked modules, which makes them more flexible and gives easier access to side branches. Closed-cell designs trade that away for radial strength and coverage. Coil stents were abandoned for poor scaffolding and radial strength, and self-expanding coronary stents fell out of use because of high restenosis.",
        },
        { kind: "h", text: "Strut thickness" },
        {
          kind: "p",
          text: "Oxford calls strut thickness a major determinant of restenosis in bare-metal stents. In ISAR-STEREO-2 (611 patients), a 50 µm interconnected-ring stent had angiographic restenosis of 17.9% against 31.4% with a 140 µm closed-cell stent, and repeat revascularisation for restenosis of 12.3% against 21.9%, with no difference in death or infarction at one year. With drug-eluting stents the drug largely suppresses the tissue growth, so this concern is much reduced; Oxford notes that the bare-metal design with the worst restenosis in such trials went on to become the platform of the first successful sirolimus-eluting stent. Brilakis's practical rule: thinner struts make a stent more deliverable, often at the cost of visibility, and he chooses a brand by its trial results, the lesion, local availability and cost.",
        },
        { kind: "tip", id: "pci-eqb-thin-strut-visibility" },
        {
          kind: "p",
          text: "**Struts and imaging.** Oxford's cardiac CT section lists previous stenting as a reason CT may not be the right test: accuracy for in-stent restenosis falls with stents under 3 mm in diameter and with thick-strut, first-generation stents. Metal stents are also a source of CT artefact, one of the arguments made for bioresorbable scaffolds.",
        },
        { kind: "h", text: "Sizes, lengths and expansion limits" },
        {
          kind: "table",
          caption: "Size facts to know before choosing a platform (Brilakis 10.1, 10.2, 22.3)",
          head: ["Question", "What the manual says"],
          rows: [
            ["Smallest drug-eluting stent", "2.0 mm, available on one platform; usable in some very small vessels"],
            ["Largest", "One platform made up to 5.0 mm, expandable to 5.75 mm; another's 4.0 mm stent also expands to 5.75 mm, and a third's 3.5 and 4.0 mm stents to 5.5 mm. Peripheral stents can be used in vessels of 6 mm or more"],
            ["Expansion limits", "Each platform has a labelled post-dilatation limit, and the same nominal size band differs between platforms (Fig. 10.1: for the 3.5–4.0 mm band, from about 4.5 mm to 5.5 mm on the platforms that chart that band). Know the limit when the proximal vessel is much larger than the distal one, as in the left main or an aneurysmal artery"],
            ["Longest", "When the manual was written, 60 mm in Europe and 40 mm in the United States; long stents are harder to deliver through tortuous and calcified segments, where more than one shorter stent may be easier"],
            ["Shaft length", "140–145 cm for the longest delivery systems listed; matters for very distal lesions and lesions reached through bypass grafts"],
            ["Sizing rule", "Diameter to the distal reference; then post-dilate the proximal segment with a larger, shorter non-compliant balloon to the proximal reference"],
          ],
        },
        { kind: "tip", id: "pci-ocx-stent-expansion-limit" },
        {
          kind: "check",
          stem: "A distal left main of 4.8 mm tapers into a 3.5 mm proximal LAD. You will stent from the LAD into the left main and optimise proximally. What must you check about the stent before choosing it?",
          options: [
            "Only that its nominal diameter matches the 4.8 mm left main",
            "That its labelled post-dilatation limit reaches about 5 mm for the size you choose",
            "That it is the thinnest-strut stent, since thin struts expand furthest",
            "That it is a closed-cell design, because only those can be post-dilated",
          ],
          answer: 1,
          explanation:
            "Brilakis sizes to the distal reference (3.5 mm here) and post-dilates proximally with a larger non-compliant balloon, so the platform must be able to expand to the left main size: limits for the same nominal size differ between platforms (from about 4.5 to 5.5 mm for 3.5–4.0 mm stents in his chart, Fig. 10.1). Sizing to the left main would oversize the LAD and risk dissection, perforation or carina shift. Strut thickness and cell type do not tell you the labelled limit.",
        },
        { kind: "h", text: "Covered stents: a different construction" },
        {
          kind: "table",
          caption: "Covered stent designs in Brilakis 30.18.1 (product names omitted; using them is taught in cm-perforation)",
          head: ["Design", "Construction", "Sizes and handling"],
          rows: [
            ["Sandwich PTFE stent", "Two stainless-steel stents with a layer of expanded PTFE between them", "2.8–4.8 mm, 16–26 mm long; bulky and hard to deliver, especially through earlier stents; needs at least 15 atm (nominal), and higher pressures for up to 60 seconds with IVUS are preferred because it is hard to expand; shortens up to 1.6 mm at each end, so overlap stents generously"],
            ["Single-layer polyurethane-covered stent", "An ultrathin-strut cobalt-chromium stent covered by an electrospun polyurethane-based fibre matrix (fibres about 2 µm; cover about 90 µm when expanded)", "2.5–5.0 mm, 15, 20 and 26 mm long; maximum post-dilatation 3.50 mm (2.5–3.0 mm sizes), 4.65 mm (3.5–4.0 mm) and 5.63 mm (4.5–5.0 mm); easier to deliver but can occasionally come off its balloon"],
            ["Single-layer PTFE stent (Europe)", "An open-cell cobalt-chromium platform with one PTFE membrane (89 ± 25 µm) clamped at both ends", "Crossing profile 1.1–1.4 mm"],
          ],
        },
        {
          kind: "p",
          text: "**Bare-metal stents today.** Brilakis's equipment chapter says latest-generation drug-eluting stents should be used in nearly all PCI. The one lesion type in which bare-metal stents have done as well is the saphenous vein graft: DIVA found no significant difference (target vessel failure 17% against 19% at 12 months), so Brilakis accepts either there (18.10.2). The 2018 ESC/EACTS guideline nevertheless recommended drug-eluting stents for any PCI (next lesson), so a drug-eluting stent remains the default even in a graft. Covered stents are listed separately because they are complication equipment.",
        },
        { kind: "h", text: "What the stent itself cannot fix" },
        {
          kind: "p",
          text: "A well-designed stent still fails if it is put in badly. Restenosis and stent thrombosis are taught in full in cp-other-complex, and the deployment steps in pm-prep-and-stent; these are the points that tie them to the device.",
        },
        {
          kind: "list",
          items: [
            "**Who restenoses (Oxford).** Restenosis is commoner with longer lesions, smaller vessels, complex lesions, diabetes and renal failure.",
            "**What prevents it (Oxford).** Careful technique: the right stent size, full expansion at deployment and complete coverage of the lesion; IVUS guidance of deployment has been shown to lower restenosis. No drug given to the patient has yet been proven to prevent it.",
            "**Sizing on imaging (Brilakis 10.2.3).** Size to the distal reference, or, when the media is visible on intravascular imaging, choose a stent diameter of 85% of the media-to-media measurement. Make the stent long enough to cover the whole lesion and every segment injured by balloons; leaving any uncovered (a 'geographic miss') raises the risk of restenosis.",
            "**Showing it is expanded (Oxford).** Deploy at no less than nominal pressure, and it is customary to record a short run with the stent balloon fully inflated to show the whole stent has opened.",
            "**What predisposes to stent thrombosis (Oxford).** Stopping dual antiplatelet therapy (or clopidogrel alone) too early, a malapposed or undersized stent, drug-eluting stents in complex lesions such as bifurcations, PCI in acute myocardial infarction, diabetes and renal dysfunction. Correct sizing, full expansion, IVUS to avoid malapposition and adherence to antiplatelet therapy are its prevention.",
            "**How often (Oxford's figures).** Up to 4 years after implantation in on-label lesions, under 1% with bare-metal stents and about 1.2–1.3% with drug-eluting stents; the Academic Research Consortium times it as early (first 30 days), late (from 30 days up to 1 year) or very late (beyond 1 year).",
          ],
        },
        {
          kind: "pitfalls",
          items: [
            "Choosing a platform for a tapering vessel without checking its labelled post-dilatation limit.",
            "Expecting a thin-strut stent to be as easy to see as an older, thicker one; use the markers and stent enhancement.",
            "Pushing one very long stent through tortuous calcium when two shorter ones would deliver.",
            "Forgetting that a sandwich covered stent shortens at both ends and needs high pressure to expand.",
            "Ordering CT to look for restenosis inside small or thick-strut stents.",
          ],
        },
        {
          kind: "pearl",
          text: "Read a stent as a list of compromises. Closed cells buy strength at the cost of branch access; thin struts buy deliverability at the cost of visibility; every platform has a size range and an expansion limit that may decide your choice before the lesion does.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "Size a stent for a vessel tapering from 4.5 mm proximally to 3.25 mm distally: choose the diameter from the distal reference, choose the post-dilatation balloon for the proximal segment, and check that the platform's labelled limit allows it; then compare two platforms with different limits.",
        },
        { kind: "video", id: "F3DfeTkz6TA", note: "A 2016 Dallas CVI lecture on new stent technologies (Brilakis channel)." },
        {
          kind: "keypoints",
          items: [
            "Restenosis is commoner in long lesions, small vessels, complex lesions, diabetes and renal failure; size correctly, expand fully, cover the whole lesion and use imaging.",
            "Properties in tension: deliverability, recoil, flexibility, radial strength, visibility; material and design together decide them.",
            "Stainless steel, then cobalt-chromium and other alloys; pre-mounted on monorail balloons; self-expanding coronary stents abandoned for restenosis.",
            "Closed-cell: strong, high coverage, less flexible; open-cell: flexible, better branch access; coil: superseded.",
            "Thinner struts: less restenosis in bare-metal stents (ISAR-STEREO-2: 17.9% vs 31.4%), better deliverability, lower visibility.",
            "Know the range: 2.0 mm smallest; up to 5.0 mm (to 5.75 mm) largest; labelled post-dilatation limits differ by platform; peripheral stents for 6 mm or more.",
            "Covered stents: sandwich PTFE (bulky, 15 atm or more, shortens) versus single-layer designs (lower profile).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-balloons-stents-cart-des-brs",
      title: "Drug-eluting stents and bioresorbable scaffolds: how they work and where they stand",
      minutes: 15,
      topics: ["eq-stent-design"],
      sources: [B("30.14"), B("10.2"), B("18.10"), O_DES, O_RESTENOSIS, O_BRS, O_ST],
      refs: [...BOOKS, "hassan-des-evolution-2022", "esc-revasc-2018", "esc-acs-2023", "esc-ccs-2024", "urban-leaders-free-2015", "ellis-absorb3-2015", "wykrzykowska-aida-2017", "miyashita-brs-outcomes-2024", "byrne-balloons-stents-scaffolds-2017", "haude-biosolve2-3y-2020", "haude-biosolve-pooled-3y-2020"],
      blocks: [
        {
          kind: "p",
          text: "Once stents had removed recoil and negative remodelling, the tissue growing through the struts became the cause of restenosis. Oxford traces the idea that followed: the smooth muscle cells of the new neointima proliferate rapidly, much as tumour cells do, which drew interest to anticancer and immune-modulating drugs. A drug-eluting stent carries such a drug to exactly the site of injury. This lesson explains how it is built, how the drugs differ, how the devices evolved, and why the attempt to make the scaffold disappear has not yet replaced metal.",
        },
        { kind: "h", text: "Three parts: platform, polymer, drug" },
        {
          kind: "steps",
          items: [
            { title: "1. The platform", detail: "The metal stent itself (previous lesson). The stent is an ideal vehicle because it puts the drug where the neointima will grow, limiting exposure of the rest of the body (Oxford)." },
            { title: "2. The polymer", detail: "Usually the drug is mixed with a biocompatible polymer that coats the stent and releases it gradually, at a rate set by the polymer, so that the drug is present while neointimal proliferation peaks (Oxford). Later designs changed the polymer: thinner coatings, then polymers that degrade, then no polymer at all (see generations below)." },
            { title: "3. The drug", detail: "Either cytotoxic (paclitaxel), killing proliferating cells, or cytostatic (sirolimus and its analogues), stopping cells moving through the cell cycle (Oxford)." },
          ],
        },
        {
          kind: "table",
          caption: "The drugs (Oxford, Drug-eluting stents)",
          head: ["Drug", "Origin and action", "Class"],
          rows: [
            ["Paclitaxel", "From the bark of the Pacific yew; stabilises microtubules, a potent cytotoxic effect", "Cytotoxic"],
            ["Sirolimus", "First found on a visit to Easter Island (hence its original name, rapamycin, after Rapa Nui); an immunomodulator used against transplant rejection, with antimitotic properties", "Cytostatic"],
            ["Zotarolimus and everolimus", "Analogues of sirolimus; the later agents used successfully on drug-eluting platforms", "Cytostatic"],
          ],
        },
        {
          kind: "check",
          stem: "Which pairing of drug and mechanism matches Oxford's description?",
          options: [
            "Sirolimus: cytotoxic, by stabilising microtubules",
            "Everolimus: cytotoxic, a derivative of paclitaxel",
            "Zotarolimus: an anticoagulant coating that prevents thrombosis",
            "Paclitaxel: cytotoxic, by stabilising microtubules",
          ],
          answer: 3,
          explanation:
            "Paclitaxel, from the Pacific yew, stabilises microtubules and kills proliferating cells (cytotoxic). Sirolimus and its analogues (zotarolimus, everolimus) are cytostatic: they arrest the cell cycle rather than kill cells. None of the stent drugs is an anticoagulant; stent thrombosis is prevented by technique and antiplatelet therapy.",
        },
        { kind: "h", text: "How the evidence was built, and how to read it" },
        {
          kind: "list",
          items: [
            "**The first drug-eluting stent** clearly improved restenosis and clinical outcomes; Oxford notes it was built on a closed-cell bare-metal design that had done poorly in randomised trials.",
            "**Paclitaxel and sirolimus stents** both reduced target lesion revascularisation (to under 10%) and major adverse cardiac events in selected trial populations, with smaller but similar benefits in more complex 'real-world' lesions.",
            "**Late lumen loss** is the millimetres of lumen a vessel loses between the angiogram after the procedure and the follow-up angiogram. Against bare-metal stents it predicted angiographic and clinical restenosis, and it became a key surrogate for comparing drug-eluting stents. Oxford warns that surrogate differences (sirolimus stents had less late loss than paclitaxel stents) do not automatically become clinical differences.",
            "**Angiographic restenosis is commoner than clinical restenosis** (clinical restenosis in only about 10%), and routine follow-up angiography inflates repeat revascularisation, which is why angiographic end points are a controversial surrogate.",
          ],
        },
        {
          kind: "table",
          caption: "Generations of drug-eluting stents (Hassan 2022 review; Oxford; Brilakis)",
          head: ["Generation", "Platform and coating", "Drug", "What changed"],
          rows: [
            ["First", "Stainless steel with thicker polymer coatings", "Paclitaxel or sirolimus", "Better than bare-metal stents, but with concerns about very late stent thrombosis (Oxford's stent thrombosis section, written in that era)"],
            ["Second", "Better alloys with thinner struts and thinner coatings", "Zotarolimus or everolimus", "Performed best in the review's account, but the durable polymer stays on the stent after the drug has gone"],
            ["Later designs", "Biodegradable polymers, then polymer-free drug coatings", "Limus drugs", "Aimed at the problems attributed to the permanent coating; a polymer-free drug-coated stent with one month of dual antiplatelet therapy beat a bare-metal stent in high bleeding risk patients (LEADERS FREE)"],
          ],
        },
        {
          kind: "p",
          text: "**Old cautions and current practice.** Oxford's drug-eluting stent section was written early: it lists high cost, short follow-up, unknown effects of combining stents and a possible hazard of stent thrombosis, and gives as indications lesions or patients at high risk of restenosis, restenotic lesions, and English (NICE) guidance recommending drug-eluting stents for vessels under 3 mm and/or lesions over 15 mm. Its stent thrombosis section explains the worry of that era: by suppressing restenosis the drug may also delay the re-endothelialisation that protects a stent from thrombus, and very late thrombosis was seen sometimes despite dual antiplatelet therapy. Brilakis, writing later, uses newer-generation drug-eluting stents in the vast majority of patients because they have both less restenosis and less stent thrombosis than bare-metal stents, with saphenous vein grafts the only subset where the two perform similarly. The 2018 ESC/EACTS revascularisation guideline recommended drug-eluting stents over bare-metal stents for any PCI. Later ESC guidelines (2023 acute coronary syndromes, 2024 chronic coronary syndromes) have replaced parts of that document; stent choice in primary PCI under the 2023 guideline is taught in pm-prep-and-stent. Treat Oxford's early list as history, not as a guide to stent choice.",
        },
        { kind: "tip", id: "pci-stent-check-dapt-and-surgery" },
        {
          kind: "check",
          stem: "A trial reports that stent A has 0.10 mm less late lumen loss than stent B at 9 months. What can you conclude, following Oxford's reasoning?",
          options: [
            "It is a surrogate signal; a clinical difference must be shown separately",
            "Stent A will certainly need fewer repeat procedures in practice",
            "Stent A has more stent thrombosis, because less tissue covers it",
            "Nothing, because late lumen loss has never predicted restenosis",
          ],
          answer: 0,
          explanation:
            "Late lumen loss (lumen lost between the post-procedure and follow-up angiograms) predicted restenosis when drug-eluting stents were compared with bare-metal stents, and is a key surrogate, but Oxford points out that the sirolimus stent's advantage in late loss over the paclitaxel stent had not translated into clinical differences. It is not meaningless, and it says nothing direct about thrombosis.",
        },
        { kind: "h", text: "Bioresorbable scaffolds" },
        {
          kind: "list",
          items: [
            "**The problem they target.** Oxford lists the drawbacks of leaving metal in the artery for ever: a stiffer, less compliant vessel; straightening; inflammation; disturbed vasoregulation; and disturbed remodelling.",
            "**The promise.** A scaffold that holds the vessel open (preventing recoil and restenosis) only for as long as needed, then disappears, could lower the risk of stent failure, keep future revascularisation options open, and allow later CT imaging without metal artefact.",
            "**The first scaffold tested widely in humans** (a polymer design, after nearly 30 years of uncertain research). A poly-L-lactic acid backbone coated with poly-D,L-lactic acid carrying everolimus; strut thickness 150 µm, crossing profile 1.2 mm; resorption intended over about 36 months, with loss of mass and radial support as it resorbs.",
            "**Magnesium scaffolds.** Still metal, so mechanically stronger, and resorbed by hydrolysis; the main device has 150 µm struts and a PLLA coating carrying sirolimus. **The sources disagree on speed.** Oxford states that magnesium resorbs more slowly than polymer, but the trial reports of the sirolimus-eluting magnesium scaffold describe resorption within about a year: its 3-year follow-up came two years after resorption (BIOSOLVE-II, and BIOSOLVE-II and III pooled, Haude 2020). That is faster than the roughly 3 years intended for the polymer scaffold, so do not rely on Oxford's statement here.",
            "**Technique.** Careful deployment guided by intravascular imaging, using the 'PSP' approach (pre-dilate, size, post-dilate), was considered essential for good results (Oxford).",
          ],
        },
        {
          kind: "table",
          caption: "What the trials showed",
          head: ["Study", "Design", "Result"],
          rows: [
            ["ABSORB III (2015)", "2,008 patients with stable or unstable angina, randomised 2:1 to the everolimus polymer scaffold or an everolimus cobalt-chromium stent", "Target-lesion failure at 1 year 7.8% vs 6.1%: within the non-inferiority margin; device thrombosis 1.5% vs 0.7% (not significant)"],
            ["AIDA (2017)", "1,845 patients in routine practice, scaffold vs metallic everolimus stent; reported early on the safety board's advice", "Target-vessel failure 11.7% vs 10.7% at 2 years (no significant difference), but definite or probable device thrombosis 3.5% vs 0.9% (hazard ratio 3.87)"],
            ["Long-term review (2024)", "Review of first-generation scaffold trials", "The excess risk attributed to the scaffold ended at 3 years; the higher thrombosis rate was probably due partly to polymers too weak radially, which forced thicker struts. Newer designs aim for stronger material and thinner struts"],
          ],
        },
        {
          kind: "p",
          text: "Oxford reports that, in the light of the randomised data, the 2018 European revascularisation guideline did not recommend bioresorbable scaffolds outside clinical studies, and lists the limitations of the first generation that research is trying to overcome: limited mechanical integrity and tensile strength, loss of structural continuity late in resorption, and thick struts. A 2017 review in the Lancet reached the same overall view: fully bioresorbable scaffolds had not yet matched conventional metallic drug-eluting stents in the early years after implantation.",
        },
        {
          kind: "check",
          stem: "A patient asks for a 'dissolving stent' so that nothing is left behind. What does the evidence in this lesson support telling them?",
          options: [
            "Scaffolds are now preferred because the first trials showed fewer events",
            "Scaffolds are equivalent in every respect, so the choice is cosmetic",
            "First-generation scaffolds had more device thrombosis; metal drug-eluting stents remain standard",
            "Scaffolds are banned because they caused more deaths in every trial",
          ],
          answer: 2,
          explanation:
            "In AIDA, device thrombosis was 3.5% with the scaffold against 0.9% with a metallic stent at 2 years, and ABSORB III showed non-inferiority for target-lesion failure but no advantage; the 2018 European guideline did not recommend scaffolds outside clinical studies. No trial here showed fewer events, and cardiac death in AIDA was not higher with the scaffold (2.0% vs 2.7%), so 'more deaths in every trial' is wrong too.",
        },
        {
          kind: "pitfalls",
          items: [
            "Quoting Oxford's early drug-eluting stent indications and concerns (NICE vessel-size and lesion-length criteria, cost) as a guide to current stent choice.",
            "Treating a surrogate such as late lumen loss as proof of clinical benefit.",
            "Choosing a bare-metal stent to shorten dual antiplatelet therapy: newer drug-eluting stents with a short course are the current answer (pm-prep-and-stent).",
            "Offering a first-generation bioresorbable scaffold outside a study.",
          ],
        },
        {
          kind: "pearl",
          text: "Every generation fixed the weakness of the last: stents fixed recoil, drugs fixed neointima, better alloys and thin coatings fixed thick struts and the inflammation blamed on polymer, and scaffolds tried to fix the permanence of metal but, so far, at the price of strength. When a new device appears, ask which weakness it fixes and what it gives up.",
        },
        {
          kind: "sim",
          sim: "pci-bench",
          task: "For three patients (a 2.5 mm LAD lesion with diabetes, a degenerated vein graft lesion, and a young patient asking for a scaffold), choose the stent type and say what evidence or guidance supports the choice.",
        },
        { kind: "video", id: "F3DfeTkz6TA", note: "A 2016 Dallas CVI lecture on new stent technologies (Brilakis channel)." },
        {
          kind: "keypoints",
          items: [
            "A drug-eluting stent is platform, polymer and drug; the polymer controls elution so the drug acts during peak neointimal growth.",
            "Paclitaxel is cytotoxic (microtubules); sirolimus, zotarolimus and everolimus are cytostatic.",
            "Late lumen loss is a surrogate; angiographic restenosis is commoner than clinical restenosis.",
            "Generations: stainless steel and thick coatings; better alloys, thin struts and coatings with limus drugs; then biodegradable polymers and polymer-free coatings.",
            "Newer drug-eluting stents for nearly all PCI (Brilakis; 2018 ESC/EACTS); vein grafts are the subset where bare-metal stents did as well.",
            "First-generation scaffolds: 150 µm struts, resorption over about 3 years; more device thrombosis (AIDA 3.5% vs 0.9%); not recommended outside studies (2018 ESC/EACTS, as Oxford reports).",
          ],
        },
      ],
    },
    // -----------------------------------------------------------------------
    {
      id: "eq-balloons-stents-cart-cart",
      title: "The CTO and complex PCI cart: what to stock, how to check it, how to use it",
      minutes: 15,
      topics: ["eq-complex-cart"],
      sources: [B("30.1"), B("30.2"), B("30.12"), B("30.16"), B("30.17"), B("30.18"), B("30.19"), B("30.20"), B("30.21"), B("30.22"), B("30.23"), B("8.9"), B("22.2"), B("26.2"), B("26.4"), O_RESTENOSIS],
      refs: BOOKS,
      blocks: [
        {
          kind: "p",
          text: "Brilakis opens his equipment chapter with a practical point: nobody can stock everything, because of cost and space, so a laboratory has to choose. The choice matters most in complex and CTO PCI, where the rare device (a covered stent, a coil, a re-entry system) may decide the outcome and must be found in seconds. His answer is a dedicated cart. This lesson goes deeper than the complications kit in comp-principles: what goes on the cart, how to check it, and the compatibility numbers that decide whether a bail-out device will fit through what you have already placed.",
        },
        { kind: "h", text: "Two rules for what to stock" },
        {
          kind: "steps",
          items: [
            { title: "1. Cover every step of PCI", detail: "Have at least one device for each step of the procedure: access, engagement, assessing the artery, wiring, lesion preparation, stenting, haemodynamic support and so on." },
            { title: "2. Stock only what operators know and will use", detail: "A device earns its place only if the operators understand what it does well and badly and will actually reach for it in a case; a device nobody uses just sits until it passes its date. For covered stents and coils some expiry is expected, because the complications that need them are rare; they are stocked anyway." },
          ],
        },
        {
          kind: "table",
          caption: "Brilakis's 22 equipment categories (Table 30.1), grouped by the job they do",
          head: ["Job", "Categories", "Taught in"],
          rows: [
            ["Getting in and seated", "Sheaths (femoral, radial); diagnostic and guide catheters; guide extensions; support catheters; Y-connectors with haemostatic valves", "eq-sheaths-guides, pm-wiring"],
            ["Crossing", "Microcatheters (large, small, angulated, dual lumen, plaque modification); guidewires (0.014 in.: workhorse, polymer-jacketed, stiff, support, atherectomy, externalisation, pressure; 0.035 in.: J-tip, soft, polymer-jacketed, stiff-body); CTO dissection re-entry equipment", "pm-wiring, cp-cto modules"],
            ["Preparing the lesion", "Balloons (eight categories); rotational and orbital atherectomy; laser; thrombectomy (aspiration catheters, a pump-driven aspiration system, rheolytic thrombectomy, which is infrequently used)", "This module, cp-calcium, cp-acs-thrombus"],
            ["Treating the lesion", "Stents (bare-metal, drug-eluting; covered stents listed with complication equipment); ostial lesion devices; embolic protection devices; brachytherapy (for recurrent in-stent restenosis)", "This module, cp-ostial, cp-prior-cabg, cp-other-complex"],
            ["Measuring", "Intravascular imaging (IVUS, OCT)", "pm-imaging"],
            ["Rescue", "Complication management (covered stents, coils, pericardiocentesis kit, snares); haemodynamic support (balloon pump, microaxial pump, another percutaneous assist device, VA-ECMO, external compression devices)", "cm modules, pm-support-devices"],
            ["Protecting patient and staff", "Arterial closure; radiation protection (scatter shields, a suspended shielding system); contrast management (a contrast-diversion system)", "pm-closure, hb-lab-and-radiation, cm-patient-complications"],
          ],
        },
        {
          kind: "list",
          items: [
            "**Complication equipment in every lab.** Covered stents, coils, vascular plugs, a pericardiocentesis tray and snares are rarely used, but Brilakis says they must be available in all catheterisation laboratories (30.18).",
            "**Support as part of the programme.** Because complex PCI can produce life-threatening complications, haemodynamic support devices are an important part of a comprehensive high-risk and complex PCI programme (30.20).",
            "**Contrast.** A contrast-diversion device placed between the syringe and the manifold diverts the part of each hand injection that would only reflux into the aortic root, measures the volume given, and in early studies reduced contrast volume by 20%–40% (30.21).",
            "**Brachytherapy** for recurrent in-stent restenosis is available only in a few centres; patients need dual antiplatelet therapy indefinitely afterwards (30.22). **The books differ here:** Brilakis keeps it, with drug-coated balloons, as the best option for recurrent restenosis (22.2.10), while Oxford regards it as mostly replaced by a repeat drug-eluting stent.",
          ],
        },
        {
          kind: "check",
          stem: "Your lab is offered a new re-entry device at a good price. Two operators have trained on it; the others have never seen it. By Brilakis's criteria, what is the key question before stocking it?",
          options: [
            "Whether it is the newest device on the market in its class",
            "Whether the operators will know it and actually use it when needed",
            "Whether it can be kept in a cupboard outside the procedure room",
            "Whether it has never expired on the shelf in any other centre",
          ],
          answer: 1,
          explanation:
            "Brilakis's two rules are to have at least one device for every step and to stock only equipment the operators are familiar with and willing to use, otherwise it expires unused. Novelty is not a criterion; the cart should be in reach during the case, not elsewhere; and some expiry is accepted for rarely needed rescue items such as covered stents and coils.",
        },
        { kind: "h", text: "The cart itself" },
        {
          kind: "list",
          items: [
            "**What goes on it.** All the commonly used CTO and complex PCI equipment, including complication equipment such as covered stents and coils. The example Brilakis shows (Fig. 30.120) has shelves of short wires and long wires, microcatheters and the dissection re-entry balloon, guide extensions, specialty balloons and coils.",
            "**Three conditions.** It must be at hand during the case, refilled at regular intervals, and familiar to the operators and the laboratory staff alike (30.23).",
            "**Why it pays.** Having everything in one known place makes complex procedures easier and quicker to do.",
          ],
        },
        { kind: "tip", id: "pci-eqb-cart-check" },
        { kind: "h", text: "Compatibility: will the rescue device fit?" },
        {
          kind: "table",
          caption: "Numbers to check against the guide and microcatheter you plan to use (Brilakis 30.2, 30.18, 8.9)",
          head: ["Device", "What it needs", "Note"],
          rows: [
            ["Sandwich PTFE covered stent", "6 Fr guide for 2.8–4.0 mm; the 4.5 and 4.8 mm sizes need 7 Fr", "A balloon and this covered stent together fit through an 8 Fr guide (block and deliver); otherwise a second guide is often needed"],
            ["Single-layer polyurethane-covered stent", "5 Fr guide for 2.5–4.0 mm; 6 Fr for 4.5 and 5.0 mm", "Easier to deliver; can occasionally come off its balloon"],
            ["Single-layer PTFE covered stent (Europe)", "5 Fr for all sizes", "Crossing profile 1.1–1.4 mm"],
            ["0.014 in.-compatible coils", "Pass through the standard microcatheters used in CTO PCI", "Preferred, because no microcatheter change is needed"],
            ["0.018 in.-compatible coils", "Need a larger microcatheter; of the standard CTO microcatheters, only one accepts them", "Plan the larger microcatheter in advance"],
            ["Snares", "Coronary: small snares, 2–4 mm; aorta: large, 27–45 mm or 18–30 mm", "Three-loop snares preferred; keep the collapsing tool, which is needed to reintroduce the snare"],
            ["Vascular plug", "Diameter 30%–50% larger than the vessel at the occlusion site, with enough length for the device", "Used to occlude a vessel, for example a repeatedly failing vein graft"],
            ["Pericardiocentesis", "18 gauge needle, 0.035 in. J-wire and pigtail work; a pre-assembled kit is faster", "Micropuncture and echo guidance, if time allows, add safety"],
            ["Larger guides", "A 2.0 mm rotational burr and some two-stent techniques need 7 Fr", "Plan the guide for the largest device you may need"],
            ["Trapping in a 6 Fr guide", "Too small for over-the-wire balloons and dissection re-entry devices; 6 Fr guides with a 0.071 in. lumen can trap low-profile microcatheters", "See the trapping balloon sizes in the specialty balloon lesson"],
          ],
        },
        { kind: "h", text: "More on the rescue devices" },
        {
          kind: "list",
          items: [
            "**Covered stents (30.18.1).** Both covered stents sold in the United States in 2020 were approved under a humanitarian device exemption for large-vessel perforation. The sandwich design is bulky, so it needs excellent guide support, and passing it through earlier stents may need a distal anchor or a guide extension. If contrast still leaks behind it after the perforation is covered, its ends (shoulders) may need post-dilating to press them against the wall.",
            "**A second access (26.2).** In a large-vessel perforation, strongly consider a second arterial access when the guide in use is not 8 Fr, since further large devices will probably be required; the second guide can deliver the rescue device while the first keeps a balloon inflated at the leak.",
            "**Coils (30.18.2).** Besides distal and collateral perforations, coils can stop a large-vessel perforation by occluding the vessel. When coiling a branch, take care that the coil does not prolapse back into the main vessel. Pushable coils are advanced out of the microcatheter by a pusher or a wire's leading end, so their deployment is unpredictable and cannot be undone; detachable coils are released only once their position is confirmed and can be retrieved before that, which is why Brilakis prefers them for perforations.",
            "**Fat, Brilakis's usual embolic (26.4).** For a distal perforation, Brilakis usually embolises with fat, except for very large perforations: it is always available, cheap and biologically compatible and goes through any microcatheter, but its delivery is less controlled than a coil's.",
            "**Vascular plugs (30.18.3).** A nitinol mesh disc on a delivery cable; it can be retrieved and repositioned until it is released. Of the four types, the type II plug is the one used in most vein-graft occlusions.",
            "**Snares (30.18.5).** Used to retrieve lost or entrapped equipment and also, in retrograde CTO PCI, to catch the retrograde wire. With no commercial snare to hand, one can be improvised: an exchange-length coronary wire passed through a multipurpose catheter with its tip fed back into the catheter's end to form a loop, or a wire loop held by a balloon inflated at 8–12 atm inside a guide extension.",
            "**Dissection re-entry equipment (30.16).** A stiff, metallic over-the-wire catheter whose 1 mm tip is blunt, rounded and hydrophilic-coated, spun rapidly to advance through an occlusion, and a flat 2.5 × 10 mm re-entry balloon with two opposed side ports, inflated at 4 atm so that one port faces the true lumen and a dedicated stiff wire can be steered through it. Their use is taught in the CTO modules (cp-cto-antegrade).",
          ],
        },
        { kind: "tip", id: "pci-eqb-cart-covered-fit" },
        { kind: "tip", id: "pci-eqb-cart-cto" },
        {
          kind: "check",
          stem: "During PCI of a 4.5 mm proximal RCA through a 6 Fr guide, you think about the worst case: a large-vessel perforation. Which covered stent could go through your guide, by the numbers in this lesson?",
          options: [
            "The 4.5 mm single-layer polyurethane-covered stent, which takes a 6 Fr guide",
            "The 4.5 mm sandwich PTFE covered stent, which takes a 6 Fr guide for all sizes",
            "None: every covered stent of 4.5 mm or more needs at least an 8 Fr guide",
            "Any covered stent, as long as a guide extension is used",
          ],
          answer: 0,
          explanation:
            "The single-layer polyurethane-covered stent needs 5 Fr up to 4.0 mm and 6 Fr for 4.5 and 5.0 mm, and the single-layer PTFE design is 5 Fr compatible for all sizes. The sandwich design needs 7 Fr at 4.5 and 4.8 mm (6 Fr only up to 4.0 mm). An 8 Fr guide is what lets a blocking balloon and the sandwich stent pass together, not the minimum for any covered stent; and a guide extension narrows the lumen rather than enlarging it.",
        },
        {
          kind: "steps",
          title: "Checking the cart before a complex case: a practical sequence built on Brilakis's rules",
          items: [
            { title: "1. Walk through the plan step by step", detail: "For each step of the planned PCI, name the device you will use and the one you will reach for if it fails, following the 'one device for every step' rule." },
            { title: "2. Size the guide for the bail-out, not only the plan", detail: "Check the largest rescue device you might need (covered stent, burr, two devices at once) against the guide and the table above; if it will not fit, change the guide or plan a second access before you start." },
            { title: "3. Check presence, stock and dates", detail: "Covered stents and coils are rarely used and expected to expire; confirm the sizes you could need are there and in date, and that coils match the microcatheters you will use." },
            { title: "4. Make sure the team knows the cart", detail: "Brilakis requires the cart to be known to operators and staff: brief who fetches what, and where the complication items are." },
            { title: "5. Restock afterwards", detail: "Replace what was used so that the cart is complete for the next case; regular restocking is one of his three conditions." },
          ],
        },
        { kind: "tip", id: "pci-eqb-cart-restock" },
        {
          kind: "check",
          stem: "During a long retrograde CTO a distal wire perforation needs coils, delivered through the CTO microcatheter already in place. The cart holds only 0.018 in.-compatible coils. What does this mean?",
          options: [
            "Nothing: all coils pass through any 0.014 in. microcatheter",
            "Coils cannot be used at all; only a covered stent will seal it",
            "You must push the coil with the back of the wire to make it fit",
            "You will usually need to change to a larger microcatheter first",
          ],
          answer: 3,
          explanation:
            "Coils for 0.018 in. microcatheters cannot pass through the standard CTO microcatheters, with one exception, so a change to a larger microcatheter is needed, costing time during a perforation. That is why Brilakis prefers 0.014 in.-compatible coils, which go through the microcatheter already in place, and asks each operator to know one or two coil types well.",
        },
        {
          kind: "pitfalls",
          items: [
            "Stocking devices nobody has trained on, so that they expire unused or are used badly in a crisis.",
            "A cart kept outside the room, unrestocked, or unknown to the staff who must fetch from it.",
            "Choosing a 6 Fr guide for a complex case without checking which covered stent or burr it could take.",
            "Coils that do not fit the microcatheter in use.",
            "Throwing away a snare's collapsing tool after the first attempt.",
          ],
        },
        {
          kind: "pearl",
          text: "Before the first wire goes in, say out loud the worst thing that could happen and the device that fixes it, then look at the guide in your hand and ask whether that device will pass through it. The cart only helps if the guide lets you use it.",
        },
        {
          kind: "drill",
          target: "angio-pci",
          task: "Before starting the mid-RCA CTO scenario, check the cart: list the guide size, the covered stent that would fit it for a large-vessel perforation, the coil and microcatheter pairing for a distal perforation, the snare size for the coronary artery, and who on the team will fetch each item.",
        },
        { kind: "video", id: "kWzz5t1bNdk", note: "Brilakis's Manual of PCI chapter video giving an overview of PCI equipment." },
        { kind: "video", id: "ZjaeUcNsr7w", note: "Manual of CTO PCI case 280, titled 'Compatibility'." },
        {
          kind: "keypoints",
          items: [
            "Stock at least one device for every PCI step, and only devices operators know and will use; covered stents and coils are kept even though some will expire.",
            "Complication equipment (covered stents, coils, plugs, pericardiocentesis tray, snares) must be in every lab.",
            "The CTO and complex PCI cart: common CTO and complex PCI equipment plus covered stents and coils; in reach, restocked, known to operators and staff.",
            "Covered stents: sandwich 6 Fr to 4.0 mm, 7 Fr for 4.5–4.8 mm; single-layer designs 5–6 Fr.",
            "Coils: 0.014 in.-compatible ones pass through CTO microcatheters; 0.018 in. coils need a larger microcatheter.",
            "Snares 2–4 mm in the coronaries, 18–30 or 27–45 mm in the aorta; keep the collapsing tool.",
            "Size the guide for the bail-out you may need, not only for the plan.",
          ],
        },
      ],
    },
  ],
  quiz: [
    {
      id: "eq-balloons-stents-cart-q1",
      stem: "Which statement about balloon pressures is correct according to the manuals?",
      options: [
        "Nominal pressure is the highest pressure the balloon is designed to reach safely before it ruptures",
        "Rated burst pressure is the pressure at which every balloon of that model bursts",
        "Nominal pressure gives the labelled diameter; rated pressure is the design ceiling",
        "Compliant balloons have the most predictable diameter at high inflation pressure",
      ],
      answer: 2,
      explanation:
        "Oxford defines nominal pressure as the pressure at which the balloon reaches its specified size (a 2.5 mm balloon measures 2.5 mm), and the rated or 'burst' pressure as the ceiling the balloon is built for, above which it may rupture. The rated pressure is a design limit, not the pressure at which all balloons burst, and compliant balloons are the least predictable at high pressure.",
      difficulty: 1,
      refs: ["oxford-cath-handbook"],
    },
    {
      id: "eq-balloons-stents-cart-q2",
      stem: "Why does Brilakis prefer a single-marker, 20–30 mm long, low-profile balloon as the first device for a balloon-uncrossable lesion?",
      options: [
        "The profile peaks at the central marker, so the thin front part can enter first",
        "A long balloon delivers more radial force at the lesion entry than a short balloon does",
        "A single marker makes the shaft stiffer, which improves the push into the lesion",
        "Long balloons can be rotated many times in each direction without catching the wire",
      ],
      answer: 0,
      explanation:
        "In these balloons the marker segment has the largest profile, so a longer balloon lets the thinner distal segment penetrate the lesion before the marker reaches the hardest part. Brilakis also warns against rotating a balloon more than two or three times each way, because it can stick on the wire; pushability comes from rapid-exchange shafts, not the marker.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-balloons-stents-cart-q3",
      stem: "A cutting balloon is chosen for a fibrotic in-stent restenosis. Which inflation plan follows Brilakis?",
      options: [
        "Reach 16 atm over about 3–5 seconds, then hold, as for a non-compliant balloon",
        "Inflate straight to its rated pressure, then hold the inflation for 1–2 minutes",
        "Use 30–35 atm, because the blades need very high pressure before they can cut",
        "About 1 atm every 5 seconds to 6–8 atm, not above 12 atm, deflating slowly",
      ],
      answer: 3,
      explanation:
        "The blades need time to come out of the balloon folds and to rewrap, so Brilakis inflates and deflates the cutting balloon slowly (about 1 atm every 5 seconds), usually to 6–8 atm and not above 12 atm in chapter 9 (chapter 23 says avoid more than 14 atm). Fast inflation risks the blades puncturing the balloon and catching in calcium; 30–35 atm is the very-high-pressure balloon's range.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-balloons-stents-cart-q4",
      stem: "How does the caged plaque modification balloon differ in mechanism from the spiral scoring balloon in Brilakis's description?",
      options: [
        "It carries blades that make three or four deep radial incisions through the plaque",
        "It runs the coronary wire alongside a tiny balloon inflated at a nominal 25 atm",
        "It forms pillows that make small dissections and grooves that stop them spreading",
        "It releases an antiproliferative drug into the vessel wall as it presses on the plaque",
      ],
      answer: 2,
      explanation:
        "The cage divides the inflated balloon into raised segments that press on the plaque and cause small, limited tears so that it opens, and recessed segments between them that keep those tears from extending. The spiral scoring balloon uses three nitinol struts; blades belong to the cutting balloon; the wire-alongside device is a separate scoring balloon; and drug release is the drug-coated balloon.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-balloons-stents-cart-q5",
      stem: "In a resistant lesion, Brilakis describes inflating non-compliant balloons often up to 26–28 atm, yet also lists pressures above 20 atm as a cause of rupture. How should a fellow reconcile this?",
      options: [
        "Ignore rated pressures, because non-compliant balloons do not rupture in calcified arteries",
        "Never exceed nominal pressure with any balloon, whatever the lesion or the balloon type",
        "Use a semi-compliant balloon instead, because it tolerates higher pressure without rupture",
        "Know each balloon's rated pressure and growth, set a ceiling, and change tool if needed",
      ],
      answer: 3,
      explanation:
        "Brilakis insists you know each non-compliant balloon's rated burst pressure and diameter growth before going high, and lists high pressure among the causes of rupture; Oxford defines the rated pressure as the design ceiling. The safe synthesis is to read the chart, decide the limit beforehand and move to plaque modification, a very-high-pressure balloon, lithotripsy or atherectomy when it is reached. Semi-compliant balloons tolerate less, not more, and nominal pressure is not a ceiling.",
      difficulty: 3,
      refs: BOOKS,
    },
    {
      id: "eq-balloons-stents-cart-q6",
      stem: "You need to trap a short wire in a 7 Fr guide to withdraw a microcatheter, with a polymer-jacketed wire in the artery. Which choice best fits Brilakis's guidance?",
      options: [
        "A 2.5 or 3.0 mm monorail or dedicated trapping balloon, 20 mm or longer",
        "A 2.0 × 12 mm over-the-wire balloon, which fits easily beside the microcatheter",
        "A 3.5 × 8 mm non-compliant balloon, so it grips the polymer jacket hard",
        "No balloon is needed, because polymer-jacketed wires do not move on withdrawal",
      ],
      answer: 0,
      explanation:
        "Brilakis matches trapping balloons to the guide (a 6 or 7 Fr guide takes 2.5 mm, a 7 or 8 Fr guide 3.0 mm), prefers monorail or dedicated trapping balloons (smaller profile than over-the-wire balloons) and wants 20 mm or more of length, especially for slippery polymer-jacketed wires. A short balloon grips poorly, a 3.5 mm one is oversized, and polymer-jacketed wires are the ones most likely to slip.",
      difficulty: 2,
      refs: BRILAKIS,
    },
    {
      id: "eq-balloons-stents-cart-q7",
      stem: "In ISAR-STEREO-2, cited by Oxford, how did a 50 µm interconnected-ring bare-metal stent compare with a 140 µm closed-cell stent?",
      options: [
        "No difference in restenosis, but less stent thrombosis with the thin-strut stent at one year",
        "More restenosis with the thin stent, because thin struts recoil more after deployment",
        "Less death and infarction at one year with the thin stent, with similar restenosis",
        "Less restenosis with the thin stent: 17.9% against 31.4% at follow-up angiography",
      ],
      answer: 3,
      explanation:
        "Angiographic restenosis was 17.9% with the thin-strut stent and 31.4% with the thick-strut stent, and repeat revascularisation for restenosis 12.3% against 21.9%; death and infarction at one year did not differ. This is why Oxford calls strut thickness a major determinant of restenosis in bare-metal stents, a concern much reduced once drugs suppressed neointimal growth.",
      difficulty: 3,
      refs: ["oxford-cath-handbook", "pache-isar-stereo2-2003"],
    },
    {
      id: "eq-balloons-stents-cart-q8",
      stem: "Which statement about bioresorbable scaffolds is supported by the sources in this module?",
      options: [
        "AIDA found more device thrombosis with the scaffold: 3.5% against 0.9% at 2 years",
        "The first widely tested scaffold had thinner struts than the metal stents it was compared with",
        "ABSORB III showed the scaffold was superior to the metallic stent for target-lesion failure",
        "The first widely tested polymer scaffold was designed to resorb within about 6 months",
      ],
      answer: 0,
      explanation:
        "AIDA reported definite or probable device thrombosis in 3.5% with the scaffold against 0.9% with the metallic stent (hazard ratio 3.87). The first scaffold tested widely in humans had 150 µm struts (thick by modern standards), its resorption was intended to take about 36 months, not 6, and ABSORB III showed non-inferiority, not superiority (7.8% against 6.1% target-lesion failure).",
      difficulty: 3,
      refs: ["oxford-cath-handbook", "wykrzykowska-aida-2017", "ellis-absorb3-2015"],
    },
    {
      id: "eq-balloons-stents-cart-q9",
      stem: "A complex left main PCI is planned through a 6 Fr guide from the radial artery. Thinking of the worst case, which limitation of that guide should be on your pre-case cart check?",
      options: [
        "It cannot take any covered stent, whatever the design and whatever the diameter",
        "It cannot take 0.014 in.-compatible coils, because these need at least a 7 Fr guide",
        "It cannot take a 2.0 mm burr, and the sandwich covered stent only up to 4.0 mm",
        "It cannot take a pressure wire alongside a stent, so physiology must be done first",
      ],
      answer: 2,
      explanation:
        "Brilakis notes a 2.0 mm rotational burr needs a 7 Fr guide, and the sandwich PTFE covered stent needs 7 Fr for its 4.5 and 4.8 mm sizes (6 Fr only up to 4.0 mm); single-layer covered stents do pass 5–6 Fr guides, so 'no covered stent' is wrong. Coils are limited by the microcatheter, not the guide.",
      difficulty: 3,
      refs: BRILAKIS,
    },
    {
      id: "eq-balloons-stents-cart-q10",
      stem: "Which set of conditions does Brilakis attach to the CTO and complex PCI cart?",
      options: [
        "Kept in the store room, checked once a year, and opened only by the senior operator",
        "Limited to complication equipment, so that the routine devices stay on the shelves",
        "Stocked with every device on the market, so that nothing is ever missing in a case",
        "Readily available in the case, restocked regularly, known to operators and staff",
      ],
      answer: 3,
      explanation:
        "The cart holds the commonly used CTO and complex PCI equipment together with complication devices such as covered stents and coils, and it has to be at hand during the case, refilled at regular intervals and familiar to operators and laboratory staff alike. Cost and space make 'everything' impossible, which is why Brilakis sets selection rules, and a cart in a store room defeats its purpose.",
      difficulty: 1,
      refs: BRILAKIS,
    },
    {
      id: "eq-balloons-stents-cart-q11",
      stem: "Oxford's drug-eluting stent section lists cost and short follow-up as concerns and cites English guidance recommending these stents for vessels under 3 mm and/or lesions over 15 mm. How should this be applied today?",
      options: [
        "Treat it as dated: newer drug-eluting stents are used for nearly all PCI",
        "Follow it: use bare-metal stents in large vessels with short lesions",
        "Follow it only in diabetic patients, where restenosis is less frequent",
        "Treat it as current, because no later guideline has addressed stent type",
      ],
      answer: 0,
      explanation:
        "The list dates from the first-generation era. Brilakis uses newer drug-eluting stents in the vast majority of patients for both less restenosis and less stent thrombosis, with vein grafts the only subset where bare-metal stents did as well, and the 2018 ESC/EACTS revascularisation guideline recommended drug-eluting stents over bare-metal stents for any PCI. Diabetes raises, not lowers, restenosis risk.",
      difficulty: 2,
      refs: [...BOOKS, "esc-revasc-2018"],
    },
    {
      id: "eq-balloons-stents-cart-q12",
      stem: "A 3.0 mm non-compliant balloon leaves a waist in a heavily calcified de novo LAD lesion at its rated pressure after a prolonged inflation. Which next step is most consistent with the manuals?",
      options: [
        "Deploy the stent now and post-dilate it afterwards at 26–28 atm to open the waist",
        "Switch to a semi-compliant balloon of the same size and inflate it to a higher pressure",
        "Do not stent yet; escalate the preparation and confirm full expansion first",
        "Place a drug-coated balloon instead, since the lesion cannot be expanded by any balloon",
      ],
      answer: 2,
      explanation:
        "Brilakis is explicit that a stent should not be implanted in a lesion a balloon cannot expand: underexpansion after stenting is much harder to treat and predisposes to thrombosis and restenosis. Escalation (plaque modification balloon, atherectomy, or where available lithotripsy or the very-high-pressure balloon) comes first, chosen as cp-calcium teaches, and expansion is confirmed with a 1:1 balloon. A semi-compliant balloon tolerates less pressure, and a drug-coated balloon does not open an undilatable lesion.",
      difficulty: 3,
      refs: BRILAKIS,
    },
  ],
  sims: [
    { sim: "pci-bench", task: "Read the compliance charts of a semi-compliant and a non-compliant balloon, choose the balloon and pressure for predilatation, post-dilatation and malapposition, and check a stent platform's post-dilatation limit against a tapering vessel." },
  ],
  caseIds: ["eq-balloons-stents-cart-case-undilatable", "eq-balloons-stents-cart-case-cart"],
};

// ---------------------------------------------------------------------------
// Cases
// ---------------------------------------------------------------------------

export const cases: CaseStudy[] = [
  {
    id: "eq-balloons-stents-cart-case-undilatable",
    title: "The waist that would not open: choosing the right balloon in a calcified LAD",
    trackId: "equipment",
    stage: 3,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, 30.9 (balloons), 9.7.3 and 9.7.9 (balloon choice and inflation), 9.9 (balloon expansion), 19.9.3 (balloons in calcified lesions), 23.1.1 (small balloons), 23.2 (balloon-undilatable lesions) and 10.2 (stent size and deployment); Oxford, chapter 8, Angioplasty balloons" },
    summary: "A heavily calcified proximal LAD lesion that will not admit a standard balloon and then will not expand: matching each balloon type to the problem, respecting pressures, and not stenting until the lesion has opened.",
    presentation:
      "A 72-year-old man with diabetes and angina despite two anti-anginal drugs has a 90% calcified stenosis of the proximal LAD, 16 mm long, with a 3.0 mm distal reference. Access is right femoral with a 7 Fr EBU 3.5 guide; a workhorse wire is in the distal LAD. Blood pressure 136/74 mmHg, heart rate 68/min, ACT 290 s.",
    findings: [
      "Dense calcium on both sides of the vessel on fluoroscopy before contrast.",
      "Good guide position, normal pressure trace.",
      "No atherectomy device is available today; a spiral scoring balloon, a cutting balloon and a very-high-pressure balloon are on the cart.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "A 2.5 × 15 mm non-compliant balloon will not enter the lesion. What is your next balloon?",
        options: [
          {
            text: "A new 1.0–1.25 mm single-marker, rapid-exchange balloon, 20 mm long",
            best: true,
            feedback: "Right. The lowest-profile balloon first, long so that the thin front segment enters before the marker arrives; non-compliant balloons have higher profiles and are less flexible.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A cutting balloon, since the lesion is calcified",
            feedback: "Plaque modification balloons are bulkier and less deliverable than standard balloons; one that cannot follow a 2.5 mm balloon will not cross either, and pushing it costs guide and wire position.",
            stateDelta: { stability: -10, flags: ["position-lost"] },
            next: "c-bulky",
          },
          {
            text: "Push the 2.5 mm balloon harder while the assistant advances the guide",
            feedback: "Force against an uncrossable lesion backs the guide out or drives it deep, and the wire tip moves distally: dissection or perforation risk.",
            stateDelta: { stability: -10, flags: ["position-lost"] },
            next: "c-bulky",
          },
        ],
      },
      {
        id: "c-bulky",
        kind: "consequence",
        prompt: "The guide has backed out of the left main and the wire has slipped back to the mid LAD. What now?",
        options: [
          {
            text: "Re-engage over the wire, re-advance the wire distally, and start again with the smallest, lowest-profile balloon",
            best: true,
            feedback: "Recover the position first, then restart the escalation from the lowest-profile device.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep pushing the device from where the guide is now",
            feedback: "Without a seated guide and a distal wire every push risks the ostium and the vessel.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s2",
        prompt: "The small balloon crosses and is inflated. A 3.0 × 15 mm non-compliant balloon now crosses but leaves a clear waist at 18 atm. Its chart gives a rated pressure of 20 atm. What do you do?",
        info: "Once an imaging catheter will cross, IVUS or OCT shows the arc, thickness, length and depth of the calcium and guides the escalation: Brilakis links a calcium arc over 180°, thickness over 0.5 mm and length over 5 mm on OCT with stent underexpansion, and treats superficial or nodular calcium with atherectomy where it is available (tool choice by calcium morphology is taught in cp-calcium).",
        options: [
          {
            text: "Hold a prolonged inflation up to the rated pressure, watching the inflation-device pressure; if the waist persists, change tool",
            best: true,
            feedback: "Brilakis uses high pressure with long inflations (1–2 minutes in calcium; a falling pressure means the lesion is giving), knows the balloon's rated pressure and growth, and escalates when it fails.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Take the same balloon to 30 atm to break the calcium",
            feedback: "Far above this balloon's rated pressure, in nodular calcium: the setting in which balloons rupture and dissect or perforate the vessel.",
            stateDelta: { stability: -25, flags: ["rupture"] },
            next: "c-rupture",
          },
          {
            text: "Accept the waist and deploy the stent",
            feedback: "A stent in a lesion that will not expand stays underexpanded, which is far harder to treat and raises the risk of thrombosis and restenosis.",
            stateDelta: { stability: -20, flags: ["underexpanded"] },
            next: "c-underexpanded",
          },
        ],
      },
      {
        id: "c-rupture",
        kind: "consequence",
        prompt: "The inflation-device pressure suddenly falls. What is the sequence?",
        info: "Contrast puffs around the balloon on fluoroscopy.",
        options: [
          {
            text: "Apply suction at once, remove the balloon, aspirate the guide, then angiography to look for perforation, air or dissection",
            best: true,
            feedback: "Suction stops contrast jetting from the tear, the guide is aspirated for air, and angiography decides the next step; a perforation needs a balloon inflated at once at the site.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Reinflate the ruptured balloon to finish the dilatation",
            feedback: "A ruptured balloon cannot hold pressure and may jet contrast or air into the wall.",
            stateDelta: { stability: -15, flags: ["perforation"] },
          },
        ],
      },
      {
        id: "c-underexpanded",
        kind: "consequence",
        prompt: "The deployed stent has a waist in its middle on stent enhancement. What is the next step?",
        options: [
          {
            text: "Non-compliant balloon at least the stent diameter at high pressure, and imaging; accept that options are now limited",
            best: true,
            feedback: "High-pressure non-compliant post-dilatation and imaging come first. If the stent stays underexpanded, the very-high-pressure balloon on the cart is the next option, and laser with contrast is the usual tool inside an underexpanded stent where available; atherectomy within a recently placed stent carries a higher risk of burr entrapment, embolisation and stent damage. Prevention before stenting was the better option.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Place a second stent inside the first to add radial strength",
            feedback: "More metal does not expand a lesion that resisted the first stent; it only adds layers that make later treatment harder.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The waist persists at the rated pressure. Which device next?",
        options: [
          {
            text: "A spiral scoring balloon, 1:1, ready to add support if it will not cross",
            best: true,
            feedback: "Standard balloons first, then plaque modification balloons: the spiral scoring balloon has a lower profile than the cutting balloon and needs no slow inflation.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A cutting balloon inflated quickly to 16 atm",
            feedback: "Cutting balloons go up about 1 atm every 5 seconds to 6–8 atm, never above 12–14 atm; fast, high inflation risks blade puncture, entrapment and rupture.",
            stateDelta: { stability: -20, flags: ["blade-entrapment"] },
            next: "c-cutting",
          },
          {
            text: "A larger 3.5 mm non-compliant balloon to apply more force",
            feedback: "Oversizing a balloon in calcium raises the risk of perforation; Brilakis sizes 1:1 or less, slightly undersized in undilatable lesions.",
            stateDelta: { stability: -15, flags: ["perforation-risk"] },
          },
        ],
      },
      {
        id: "c-cutting",
        kind: "consequence",
        prompt: "The cutting balloon deflates slowly and resists withdrawal. What do you do?",
        options: [
          {
            text: "Wait for full deflation under fluoroscopy, then withdraw gently with the guide coaxial, watching for struts or the wire moving",
            best: true,
            feedback: "Blades must rewrap before withdrawal; pulling early injures the artery and can fracture a blade or entrap the balloon. Entrapment management is taught in cm-equipment-loss.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Pull it back hard before it has fully deflated",
            feedback: "Oxford warns the blades damage the vessel if the balloon is withdrawn before full deflation.",
            stateDelta: { stability: -15, flags: ["dissection"] },
          },
        ],
      },
      {
        id: "s4",
        prompt: "After the scoring balloon, the 3.0 mm non-compliant balloon still shows a small waist at its rated pressure. The very-high-pressure balloon is on the cart. What is your plan?",
        options: [
          {
            text: "Use the very-high-pressure balloon at about 30–35 atm, sized conservatively, with the perforation plan ready",
            best: true,
            feedback: "It is a purpose-built non-compliant balloon for this pressure range; it opened more than 90% of undilatable lesions in its series, with a real risk of vessel rupture, so have the perforation kit and plan ready.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Stent now; the waist is small",
            feedback: "Any residual waist predicts underexpansion; Brilakis requires full balloon expansion before the stent.",
            stateDelta: { stability: -15, flags: ["underexpanded"] },
            next: "c-underexpanded",
          },
        ],
      },
      {
        id: "s5",
        prompt: "The waist has gone. You deploy a 3.0 × 20 mm drug-eluting stent at 12–14 atm. What next?",
        options: [
          {
            text: "Post-dilate with a shorter non-compliant balloon at 20 atm or more inside the stent, then image to confirm expansion",
            best: true,
            feedback: "High-pressure post-dilatation with a shorter non-compliant balloon is Brilakis's routine, especially in calcium, and imaging confirms the result. He skips it only when imaging already shows excellent expansion, when thrombus or plaque embolisation is a worry, or when a large jailed branch could be compromised.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Post-dilate with the stent's own balloon at 24 atm",
            feedback: "Oxford warns that the stent balloon's ends can overhang the stent and injure normal vessel at high pressure; use a separate, shorter non-compliant balloon.",
            stateDelta: { stability: -10, flags: ["edge-injury"] },
          },
        ],
      },
    ],
    outcome:
      "The lesion was crossed with a low-profile balloon, expanded with a scoring balloon and a very-high-pressure balloon, and stented only once a 1:1 balloon expanded fully; imaging after post-dilatation showed good expansion without dissection.",
    outcomeVariants: [
      { flag: "rupture", text: "The balloon taken far beyond its rated pressure ruptured; angiography had to exclude perforation and air before the case could continue." },
      { flag: "underexpanded", text: "A stent placed before the lesion had opened remained underexpanded, leaving a higher risk of thrombosis and restenosis." },
      { flag: "blade-entrapment", text: "The fast, high-pressure cutting balloon inflation made withdrawal difficult and risked blade fracture or entrapment." },
      { flag: "edge-injury", text: "High-pressure inflation of the stent's own balloon injured the vessel beyond the stent edges." },
      { flag: "position-lost", text: "Pushing a device that could not cross cost guide and wire position and time." },
    ],
    learningPoints: [
      "Cross with the lowest-profile balloon: single marker, long, new, rapid exchange.",
      "Non-compliant balloons test expansion and post-dilate, but cross less well.",
      "Know the rated pressure and growth of each balloon; change tool rather than exceed it.",
      "Standard balloons first, then plaque modification; the cutting balloon slowly and at 6–8 atm, never above 12–14 atm.",
      "The very-high-pressure balloon is usually inflated at 30–35 atm (it can deliver more than 40) and carries a real rupture risk.",
      "No stent until a 1:1 balloon expands fully; then post-dilate with a shorter non-compliant balloon.",
    ],
    refs: [...BOOKS, "secco-opn-2019", "barbato-calcium-consensus-2023"],
  },
  {
    id: "eq-balloons-stents-cart-case-cart",
    title: "Check the cart: a retrograde CTO and a perforation",
    trackId: "equipment",
    stage: 4,
    provenance: { kind: "synthetic", basedOn: "Brilakis, Manual of PCI, chapter 30 introduction, 30.2 (guide size), 30.18 (covered stents, coils, snares, pericardiocentesis), 30.20 (haemodynamic support) and 30.23 (the CTO-complex PCI cart); 8.9 (trapping); 26.2 and 26.4 (general and distal perforation management)" },
    summary: "Preparing the cart and the guides for a complex CTO case so that the bail-out devices will fit, and then using them when a distal wire perforation occurs.",
    presentation:
      "A 66-year-old woman with refractory angina has a chronic total occlusion of the mid RCA, 25 mm long, with septal collaterals from the LAD. Dual femoral access is planned with a retrograde option. Ejection fraction is 50%. Blood pressure 140/78 mmHg, heart rate 70/min.",
    findings: [
      "Proximal RCA 4.5 mm; distal RCA 3.0 mm.",
      "The laboratory has a CTO and complex PCI cart; it was last restocked two weeks ago.",
      "Coils in the lab: one box of 0.014 in.-compatible detachable coils and several 0.018 in. pushable coils.",
    ],
    steps: [
      {
        id: "s1",
        prompt: "Which guide do you choose for the RCA?",
        options: [
          {
            text: "An 8 Fr guide, so that a balloon and a sandwich covered stent can pass together, and any 4.5 mm covered stent fits",
            best: true,
            feedback: "Size the guide for the bail-out as well as the plan: the sandwich design needs 7 Fr at 4.5 mm, and 8 Fr allows block and deliver through one guide.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A 6 Fr guide to keep the arteriotomy small",
            feedback: "A 6 Fr guide cannot take the 4.5 mm sandwich covered stent and limits trapping and two-device work; the plan is fixed by the smallest possible guide rather than by what might be needed.",
            stateDelta: { stability: -10, flags: ["small-guide"] },
          },
        ],
      },
      {
        id: "s2",
        prompt: "Before the first wire, how do you check the cart?",
        options: [
          {
            text: "Walk through each step and its bail-out, confirm covered stent sizes and dates, coils that fit the CTO microcatheter, snares, and brief the team on who fetches what",
            best: true,
            feedback: "Brilakis's rules: a device for every step, equipment the team knows, a cart in reach, restocked and known to operators and staff; rarely used covered stents and coils are the items most likely to have expired.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Trust that it was restocked two weeks ago and start",
            feedback: "A cart restocked after the last case may still lack the sizes this case could need, or hold expired rescue items.",
            stateDelta: { stability: -10, flags: ["unchecked-cart"] },
            next: "c-missing",
          },
        ],
      },
      {
        id: "c-missing",
        kind: "consequence",
        prompt: "Half way through, a nurse mentions that the only 4.5 mm covered stent was used last week and not replaced. What now?",
        options: [
          {
            text: "Pause, confirm what covered stents are available, arrange a fitting device now, and consider whether the plan should change",
            best: true,
            feedback: "Find the gap before you need the device; a large-vessel perforation without a fitting covered stent is a much harder problem.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Carry on; perforations are rare",
            feedback: "Rare complications are the reason the cart exists; this one would now have no definitive fix to hand.",
            stateDelta: { stability: -15, flags: ["no-covered-stent"] },
          },
        ],
      },
      {
        id: "s3",
        prompt: "The retrograde wire is exchanged and you need to withdraw an over-the-wire microcatheter over a short wire in the 8 Fr guide. Which trapping balloon?",
        options: [
          {
            text: "A 3.0 mm balloon, 20 mm or longer, monorail or dedicated trapping type",
            best: true,
            feedback: "An 8 Fr guide takes a 3.0 mm trapping balloon; it must also be long enough to pin the wire, especially a polymer-jacketed one.",
            stateDelta: { stability: 5 },
          },
          {
            text: "A 2.0 × 8 mm balloon that happens to be open",
            feedback: "Too small and too short to pin the wire reliably in an 8 Fr guide; the wire can slip back as the microcatheter is pulled.",
            stateDelta: { stability: -10, flags: ["wire-lost"] },
            next: "c-wire",
          },
        ],
      },
      {
        id: "c-wire",
        kind: "consequence",
        prompt: "The wire has slipped back from its distal position as the microcatheter came out. What do you do?",
        options: [
          {
            text: "Re-advance the wire carefully under fluoroscopy, then repeat the exchange with a correctly sized trapping balloon",
            best: true,
            feedback: "Recover the wire position before any further device goes in, then trap properly.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Advance a balloon over the wire wherever it lies now",
            feedback: "A balloon over a wire that may not be in the true distal lumen risks dissection or perforation.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4-block",
        prompt: "After stenting, contrast is seen leaving a distal branch where a wire tip had been: a distal wire perforation. What is your first action?",
        options: [
          {
            text: "Inflate a vessel-sized semi-compliant balloon just proximal to the leak at no more than 8–10 atm, check for effusion on echo, and alert the surgeons",
            best: true,
            feedback: "In every perforation the first step is a balloon proximal to (or at) the site, inflated at once to stop blood entering the pericardium: semi-compliant, sized to the vessel, no more than 8–10 atm so that it occludes without overstretching. Echo sizes the effusion, pericardiocentesis is needed if the patient becomes hypotensive, and early notice to cardiac surgery speeds things up if percutaneous treatment fails.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Give protamine now to reverse the heparin, with the wire, guide and microcatheter still in the coronary artery",
            feedback: "Brilakis reverses heparin only after all equipment is out and the pericardium has been drained: reversal with equipment in place risks guide or vessel thrombosis, and clotted pericardial blood cannot be drained.",
            stateDelta: { stability: -15, flags: ["early-reversal"] },
            next: "c-unblocked",
          },
          {
            text: "Make repeated contrast injections through the guide to define the exact site and size of the leak",
            feedback: "Each injection pushes more contrast and blood through the hole while nothing is stopping the flow; block the vessel first, then define the leak with microcatheter tip injections.",
            stateDelta: { stability: -15, flags: ["tamponade-risk"] },
            next: "c-unblocked",
          },
        ],
      },
      {
        id: "c-unblocked",
        kind: "consequence",
        prompt: "The effusion is growing on echo and the blood pressure has fallen to 86/50 mmHg. What now?",
        options: [
          {
            text: "Inflate a balloon proximal to the leak now, drain the pericardium, and call the surgical team",
            best: true,
            feedback: "Stop the inflow first; hypotension with an effusion needs immediate pericardiocentesis; and the surgeons should know early.",
            stateDelta: { stability: 10 },
          },
          {
            text: "Wait for the blood pressure to recover with fluids before doing anything in the artery",
            feedback: "Fluids and vasopressors support the pressure, but the bleeding continues until the vessel is blocked and the pericardium drained.",
            stateDelta: { stability: -10 },
          },
        ],
      },
      {
        id: "s4",
        prompt: "The balloon is occluding flow proximal to the perforation and a small effusion is stable. You decide to embolise with a coil delivered alongside the occluding balloon (block and deliver). The CTO microcatheter is still available. Which coil?",
        options: [
          {
            text: "A 0.014 in.-compatible detachable coil through the microcatheter already in use",
            best: true,
            feedback: "0.014 in.-compatible coils pass the standard CTO microcatheters, and detachable coils can be repositioned or retrieved before release, which makes them preferred for perforations. For most distal perforations Brilakis actually prefers fat, except very large ones: it passes any microcatheter and costs nothing, but it is delivered less predictably than a coil (26.4.1).",
            stateDelta: { stability: 5 },
          },
          {
            text: "A 0.018 in. pushable coil through the same microcatheter",
            feedback: "0.018 in. coils need a larger microcatheter (only one standard CTO microcatheter accepts them), and pushable coils deploy irreversibly and less predictably.",
            stateDelta: { stability: -15, flags: ["coil-delay"] },
            next: "c-coil",
          },
          {
            text: "Deflate the occluding balloon so the coil can be sent in without the balloon in the way",
            feedback: "The occluding balloon is what stops the bleeding. In block and deliver it is deflated only briefly to pass the second wire and the microcatheter into the perforated branch, then reinflated at once. The coil is delivered with the balloon inflated, and microcatheter tip injections check the seal without deflating it (26.4.1).",
            stateDelta: { stability: -15, flags: ["tamponade-risk"] },
            next: "c-coil",
          },
        ],
      },
      {
        id: "c-coil",
        kind: "consequence",
        prompt: "No coil is in place yet and contrast is still leaking into the pericardium. What do you do now?",
        options: [
          {
            text: "Keep or re-inflate the balloon just proximal to the leak, check for tamponade, then deliver a coil that fits the microcatheter alongside it",
            best: true,
            feedback: "Stopping flow to the perforation buys time. Through a single guide (6 Fr or larger, depending on the microcatheter: Brilakis Table 26.2) a microcatheter and coil are delivered alongside the occluding balloon (block and deliver). The balloon is deflated only briefly to pass the second wire and then the microcatheter, and is reinflated for coil delivery, when microcatheter tip injections check the seal.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Keep injecting contrast to watch the leak while the microcatheter is fetched",
            feedback: "Each injection adds to the bleed and nothing stops the flow into the perforation while you wait.",
            stateDelta: { stability: -15, flags: ["tamponade-risk"] },
          },
        ],
      },
      {
        id: "s5",
        prompt: "The perforation is sealed. At the end of the case, what remains for the cart?",
        options: [
          {
            text: "Restock what was used, including the coil and the trapping balloon, and report the missing covered stent size",
            best: true,
            feedback: "Regular restocking is one of Brilakis's three conditions for the cart; the next operator should not discover the gap mid-case.",
            stateDelta: { stability: 5 },
          },
          {
            text: "Leave restocking to the next team",
            feedback: "An unrestocked cart is the commonest way rare rescue items go missing when needed.",
            stateDelta: { stability: -5, flags: ["unrestocked"] },
          },
        ],
      },
    ],
    outcome:
      "The CTO was recanalised through an 8 Fr guide chosen for the bail-out; a distal wire perforation was blocked at once with a proximal balloon and sealed with a detachable coil delivered alongside it through the CTO microcatheter already in use, and the cart was restocked.",
    outcomeVariants: [
      { flag: "small-guide", text: "The 6 Fr guide would not have taken a 4.5 mm sandwich covered stent if the proximal RCA had perforated." },
      { flag: "unchecked-cart", text: "The unchecked cart hid a missing covered stent until mid-case." },
      { flag: "no-covered-stent", text: "Had a large-vessel perforation occurred, no covered stent of the right size was available." },
      { flag: "wire-lost", text: "An undersized trapping balloon let the wire slip, costing time and risk to regain distal position." },
      { flag: "coil-delay", text: "The wrong coil for the microcatheter delayed sealing while a larger microcatheter was found." },
      { flag: "tamponade-risk", text: "Leaving the perforated vessel unblocked let the pericardial bleed grow." },
      { flag: "early-reversal", text: "Reversing heparin with equipment still in the artery risked guide and vessel thrombosis and clotted pericardial blood." },
      { flag: "unrestocked", text: "The cart was left incomplete for the next case." },
    ],
    learningPoints: [
      "Size the guide for the bail-out you may need: covered stent size and type, simultaneous devices.",
      "Check the cart before the wire: every step and its bail-out, sizes, dates, coil and microcatheter pairing, snares, and team roles.",
      "Trapping balloons: 3.0 mm for 7–8 Fr guides, 20 mm or longer.",
      "In any perforation, first inflate a semi-compliant balloon proximal to the leak (no more than 8–10 atm), check for effusion and alert surgery; reverse heparin only after the equipment is out.",
      "0.014 in.-compatible detachable coils go through CTO microcatheters alongside the occluding balloon (block and deliver) and can be retrieved before release; for most distal perforations Brilakis prefers fat, which is less controlled than a coil.",
      "Restock after every case.",
    ],
    refs: BRILAKIS,
  },
];

// ---------------------------------------------------------------------------
// Lab tips
// ---------------------------------------------------------------------------

export const tips: LabTip[] = [
  {
    id: "pci-eqb-know-the-chart",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-undilatable", "stent-underexpanded"] },
    title: "Before going high, read the balloon's chart",
    text: "Know the balloon's rated pressure and how much its diameter grows before you push the pressure up, and set your ceiling in advance. Rupture becomes more likely above 20 atm, especially in nodular calcium; when an ordinary non-compliant balloon reaches its limit, change to a device built for the job rather than inflating further.",
    tone: "caution",
    lessonId: "eq-balloons-stents-cart-standard",
    sources: [B("9.7"), B("23.2"), B("19.9"), O_BALLOONS],
    refs: BOOKS,
  },
  {
    id: "pci-eqb-standard-first",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-uncrossable"] },
    title: "Non-compliant will not cross? Go smaller and softer first",
    text: "Non-compliant balloons are bulkier where they cross and stiffer than semi-compliant ones. If one will not cross, open the lesion with a small, low-profile balloon and come back with the non-compliant balloon to test expansion; plaque modification balloons are bulkier still and are not the next crossing device.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-standard",
    sources: [B("19.9"), B("9.7"), B("23.1"), B("30.9")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-postdil-which-balloon",
    lab: "pci",
    when: { phase: ["optimise", "imaging"], event: ["stent-underexpanded"] },
    title: "Underexpanded or malapposed: pick the balloon for the problem",
    text: "For an underexpanded stent use a non-compliant balloon at least as large as the stent, above 18 atm. For extensive malapposition (a gap of 400 µm or more, or 1 mm or more long) use a semi-compliant balloon at low pressure: the aim is contact, not force.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-standard",
    sources: [B("13.3"), B("10.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-scoring-or-cutting",
    lab: "pci",
    when: { phase: ["lesion-prep"], event: ["balloon-undilatable"] },
    title: "Choosing a plaque modification balloon",
    text: "A spiral scoring balloon crosses more easily than a cutting balloon and leaves denser scoring; a caged balloon opens the lesion through small, limited tears. Only the cutting balloon needs slow, low-pressure inflation. All are less deliverable than standard balloons, so be ready with anchoring or a guide extension.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-specialty",
    sources: [B("30.9"), B("19.9"), B("23.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-very-high-pressure",
    lab: "pci",
    when: { phase: ["lesion-prep", "optimise"], event: ["balloon-undilatable", "stent-underexpanded"] },
    title: "Very-high-pressure balloon: usually 30–35 atm, capable of more than 40",
    text: "The dedicated very-high-pressure non-compliant balloon is usually used at about 30–35 atm and opened more than 90% of undilatable lesions in its series, but vessel rupture is quoted at 2%–3%. Size it conservatively, have the perforation plan ready, and confirm full expansion before the stent goes in, or, if the stent is already in, on imaging afterwards.",
    tone: "caution",
    lessonId: "eq-balloons-stents-cart-specialty",
    sources: [B("30.9"), B("9.7"), B("19.9"), B("23.2")],
    refs: [...BRILAKIS, "raja-opn-high-pressure-2010", "secco-opn-2019"],
  },
  {
    id: "pci-eqb-trapping-balloon-size",
    lab: "pci",
    when: { phase: ["wire", "lesion-prep"], event: ["microcatheter-removal"] },
    title: "Trapping balloon: 2.5 mm for 6–7 Fr, 3.0 mm for 7–8 Fr, 20 mm or longer",
    text: "Pin the wire with a monorail or dedicated trapping balloon (lower profile than an over-the-wire balloon), sized to the guide (2.5 mm if it is 6 or 7 Fr, 3.0 mm if it is 7 or 8 Fr), ideally 20 mm or longer to grip slippery polymer-jacketed wires. Replace a used trapping balloon that has deformed.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-specialty",
    sources: [B("8.9"), B("30.9")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-ostial-flare-markers",
    lab: "pci",
    when: { phase: ["optimise"], vessel: ["RCA", "LM"], requires: ["aorto-ostial-lesion"] },
    title: "Dual-balloon ostial flaring catheter: read the three markers",
    text: "Put the proximal marker in the aorta and the middle marker at the ostium; the distal marker ends the 8 mm angioplasty balloon. Inflate the distal balloon with the inflation device and the large proximal anchoring balloon with a 1 mL syringe.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-specialty",
    sources: [B("30.13")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-thin-strut-visibility",
    lab: "pci",
    when: { phase: ["stent"] },
    title: "Thin struts deliver well but are harder to see",
    text: "Thinner-strut stents are more deliverable, often at the cost of visibility. Position by the markers and landmarks, and use stent enhancement or imaging to judge expansion rather than the plain image alone.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-stent-build",
    sources: [B("10.2"), O_PROC],
    refs: BOOKS,
  },
  {
    id: "pci-eqb-cart-check",
    lab: "pci",
    when: { phase: ["plan"] },
    title: "Complex case? Check the cart before the first wire",
    text: "Walk the plan step by step with a bail-out for each, confirm the rare rescue items (covered stents, coils, snares) are there, in date and in the sizes you could need, and make sure the staff know where the cart is and who fetches what.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-cart",
    sources: [B("30.1"), B("30.18"), B("30.23")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-cart-covered-fit",
    lab: "pci",
    when: { phase: ["plan", "guide"] },
    title: "Will a covered stent go through this guide?",
    text: "The sandwich PTFE covered stent needs a 6 Fr guide up to 4.0 mm and 7 Fr for 4.5–4.8 mm; with a blocking balloon alongside it, 8 Fr. Single-layer covered stents pass 5–6 Fr guides. Choose the guide for the bail-out you may need.",
    tone: "caution",
    lessonId: "eq-balloons-stents-cart-cart",
    sources: [B("30.18"), B("30.2")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-cart-cto",
    lab: "pci",
    when: { phase: ["plan"], requires: ["cto"] },
    title: "CTO cart: wires, microcatheters, re-entry, extensions, balloons, coils",
    text: "Before a CTO, check short and long wires, microcatheters and the dissection re-entry system, guide extensions, specialty balloons, coils and covered stents. Prefer coils that pass the 0.014 in. CTO microcatheter you will use; 0.018 in. coils need a larger microcatheter.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-cart",
    sources: [B("30.23"), B("30.18")],
    refs: BRILAKIS,
  },
  {
    id: "pci-eqb-cart-restock",
    lab: "pci",
    when: { phase: ["finish"] },
    title: "Restock the cart after the case",
    text: "Replace what was used and report missing sizes, so the cart is complete and known for the next operator; regular restocking is one of the conditions that make the cart work.",
    tone: "do",
    lessonId: "eq-balloons-stents-cart-cart",
    sources: [B("30.23")],
    refs: BRILAKIS,
  },
];

// ---------------------------------------------------------------------------
// New references (checked on PubMed)
// ---------------------------------------------------------------------------

export const refs: Reference[] = [
  {
    id: "raja-opn-high-pressure-2010",
    kind: "case",
    citation: "Raja Y, Routledge HC, Doshi SN. A noncompliant, high pressure balloon to manage undilatable coronary lesions. Catheter Cardiovasc Interv. 2010;75:1067–1073.",
    url: "https://doi.org/10.1002/ccd.22430",
    note: "PMID: 20517970. Checked on PubMed: authors, title, journal, year 2010, volume 75, issue 7, pages 1067–1073. Abstract read: a high-pressure non-compliant balloon, rated burst pressure 35 atm, twin-layer technology for uniform expansion without dog-boning; four cases after failed standard non-compliant dilatation. Brilakis's reference 56 in chapter 30.",
    verified: true,
  },
  {
    id: "pache-isar-stereo2-2003",
    kind: "trial",
    citation: "Pache J, Kastrati A, Mehilli J, et al. Intracoronary stenting and angiographic results: strut thickness effect on restenosis outcome (ISAR-STEREO-2) trial. J Am Coll Cardiol. 2003;41:1283–1288.",
    url: "https://doi.org/10.1016/s0735-1097(03)00119-0",
    note: "PMID: 12706922. Checked on PubMed: authors, title, journal, year 2003, volume 41, issue 8, pages 1283–1288. Abstract read: 611 patients; thin-strut 50 µm interconnected-ring stent vs thick-strut 140 µm closed-cell stent; angiographic restenosis 17.9% vs 31.4%; TVR for restenosis 12.3% vs 21.9%; no difference in death or MI at one year. Cited as further reading in Oxford, Intracoronary stents.",
    verified: true,
  },
  {
    id: "byrne-balloons-stents-scaffolds-2017",
    kind: "paper",
    citation: "Byrne RA, Stone GW, Ormiston J, Kastrati A. Coronary balloon angioplasty, stents, and scaffolds. Lancet. 2017;390:781–792.",
    url: "https://doi.org/10.1016/S0140-6736(17)31927-X",
    note: "PMID: 28831994. Checked on PubMed: authors, title, journal, year 2017, volume 390, issue 10096, pages 781–792; review. Abstract read: balloon angioplasty limited by dissection, recoil and restenosis; stents more stable but with early stent thrombosis and neointimal hyperplasia; DES lowered restenosis; fully bioresorbable scaffolds had not yet achieved results equivalent to metallic DES in the early years after implantation.",
    verified: true,
  },
  {
    id: "hassan-des-evolution-2022",
    kind: "paper",
    citation: "Hassan S, Ali MN, Ghafoor B. Evolutionary perspective of drug eluting stents: from thick polymer to polymer free approach. J Cardiothorac Surg. 2022;17:65.",
    url: "https://doi.org/10.1186/s13019-022-01812-y",
    note: "PMID: 35379273; PMC8981810. Checked on PubMed: authors, title, journal, year 2022, volume 17, issue 1, article 65; review. Abstract read: first-generation DES were stainless steel with thicker coatings; second generation had superior platforms with thinner struts and thin coatings, with drugs changing from paclitaxel and sirolimus to zotarolimus and everolimus; the durable coating persisting after drug elution was an issue; the third generation used biodegradable polymers and then polymer-free coatings.",
    verified: true,
  },
  {
    id: "ellis-absorb3-2015",
    kind: "trial",
    citation: "Ellis SG, Kereiakes DJ, Metzger DC, et al. Everolimus-eluting bioresorbable scaffolds for coronary artery disease. N Engl J Med. 2015;373:1905–1915.",
    url: "https://doi.org/10.1056/NEJMoa1509038",
    note: "PMID: 26457558. Checked on PubMed: authors, title, journal, year 2015, volume 373, issue 20, pages 1905–1915. Abstract read (ABSORB III): 2,008 patients with stable or unstable angina randomised 2:1 to the everolimus-eluting bioresorbable scaffold or an everolimus-eluting cobalt-chromium stent; target-lesion failure at 1 year 7.8% vs 6.1% (non-inferiority met, superiority not); device thrombosis within 1 year 1.5% vs 0.7% (P=0.13).",
    verified: true,
  },
  {
    id: "wykrzykowska-aida-2017",
    kind: "trial",
    citation: "Wykrzykowska JJ, Kraak RP, Hofma SH, et al. Bioresorbable scaffolds versus metallic stents in routine PCI. N Engl J Med. 2017;376:2319–2328.",
    url: "https://doi.org/10.1056/NEJMoa1614954",
    note: "PMID: 28402237. Checked on PubMed: authors, title, journal, year 2017, volume 376, issue 24, pages 2319–2328. Abstract read (AIDA): 1,845 patients; early reporting recommended by the data and safety monitoring board for safety concerns; target-vessel failure 11.7% vs 10.7% at 2 years (HR 1.12, P=0.43); cardiac death 2.0% vs 2.7%; definite or probable device thrombosis 3.5% vs 0.9% (HR 3.87, P<0.001).",
    verified: true,
  },
  {
    id: "haude-biosolve2-3y-2020",
    kind: "trial",
    citation: "Haude M, Ince H, Toelg R, et al. Safety and performance of the second-generation drug-eluting absorbable metal scaffold (DREAMS 2G) in patients with de novo coronary lesions: three-year clinical results and angiographic findings of the BIOSOLVE-II first-in-man trial. EuroIntervention. 2020;15:e1375–e1382.",
    url: "https://doi.org/10.4244/EIJ-D-18-01000",
    note: "PMID: 30803936. Checked on PubMed: authors, title, journal, year 2020, volume 15, issue 15, pages e1375–e1382. Abstract read: 123 patients with a magnesium-based sirolimus-eluting scaffold; the 3-year follow-up assesses the vessel 'two years beyond scaffold resorption'; target lesion failure 6.8%; no probable or definite scaffold thrombosis. Cited for the resorption timing only.",
    verified: true,
  },
  {
    id: "haude-biosolve-pooled-3y-2020",
    kind: "trial",
    citation: "Haude M, Ince H, Kische S, et al. Sustained safety and performance of the second-generation sirolimus-eluting absorbable metal scaffold: pooled outcomes of the BIOSOLVE-II and -III trials at 3 years. Cardiovasc Revasc Med. 2020;21:1150–1154.",
    url: "https://doi.org/10.1016/j.carrev.2020.04.006",
    note: "PMID: 32917533. Checked on PubMed: authors, title, journal, year 2020, volume 21, issue 9, pages 1150–1154. Abstract read: 184 patients, 189 de novo lesions; outcomes reported 'at 3 years, 2 years after scaffold resorption'; target lesion failure 6.3%; no definite or probable scaffold thrombosis. Cited for the resorption timing only.",
    verified: true,
  },
  {
    id: "miyashita-brs-outcomes-2024",
    kind: "paper",
    citation: "Miyashita K, Ninomiya K, Tobe A, et al. Long-term outcomes following bioresorbable vascular scaffolds. Expert Rev Cardiovasc Ther. 2024;22:391–407.",
    url: "https://doi.org/10.1080/14779072.2024.2375340",
    note: "PMID: 39049728. Checked on PubMed: authors, title, journal, year 2024, volume 22, issue 8, pages 391–407; review. Abstract read: higher scaffold thrombosis with first-generation scaffolds likely due in part to bioresorbable polymers with insufficient radial strength, needing larger strut profiles; meta-analysis of Absorb long-term outcomes showed the excess risk ended at 3 years; attention now on greater tensile strength and thinner struts.",
    verified: true,
  },
];
