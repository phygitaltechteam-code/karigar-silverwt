import {
  Flame,
  Layers,
  Sparkles,
  Wrench,
  Package,
  Scissors,
  Award,
  Scale,
  Printer,
  Database,
  Building2,
  Key,
  Zap,
} from 'lucide-react';

export interface ProcessStep {
  id: string;
  name: string;
  shortDesc: string;
  icon: any;
  badge: string;
  details: {
    input: string;
    output: string;
    lossMetrics: string;
    keyFeatures: string[];
  };
}

export const manufacturingSteps: ProcessStep[] = [
  {
    id: 'melting',
    name: '1. Melting & Alloy',
    shortDesc: 'Pure gold bullion alloying & karat balancing',
    icon: Flame,
    badge: 'Raw Metal Prep',
    details: {
      input: 'Pure 24K Gold (999.0) + Copper / Silver Master Alloy',
      output: 'Tested 22K (916) / 18K (750) / 14K (585) Ingot Bars',
      lossMetrics: 'Crucible combustion & vaporization loss % calculation',
      keyFeatures: [
        'Automated Touch & Purity Karat calculation',
        'Crucible loss tracking with benchmark tolerance limits',
        'Batch genealogy linking raw bullion to output ingot',
      ],
    },
  },
  {
    id: 'tar',
    name: '2. Tar (Wire Drawing)',
    shortDesc: 'Ingot rolling & precision gauge wire drawing',
    icon: Layers,
    badge: 'Wire Forming',
    details: {
      input: 'Alloyed Gold Ingot Strip',
      output: 'Calibrated Wire Spools (0.25mm - 2.5mm)',
      lossMetrics: 'Die wear, annealing scale & trimming scrap balance',
      keyFeatures: [
        'Multi-pass gauge reduction logs with weight checkpoints',
        'Automatic scrap vs dust separation calculation',
        'Operator-level yield efficiency analytics',
      ],
    },
  },
  {
    id: 'soldering',
    name: '3. Soldering (Taanka)',
    shortDesc: 'Flux application & alloy solder integration',
    icon: Sparkles,
    badge: 'Thermal Joining',
    details: {
      input: 'Drawn Wire & Formed Links + Kadka / Solder Alloy',
      output: 'Solid Bonded Chain Strands',
      lossMetrics: 'Solder weight addition vs thermal volatilization loss',
      keyFeatures: [
        'Precise Taanka / solder metal credit and debit ledger',
        'Gross weight increase vs fine gold balance calculation',
        'Gas & flux consumption optimization tracking',
      ],
    },
  },
  {
    id: 'joint',
    name: '4. Jointing Dept',
    shortDesc: 'Master link assembly & continuous link locking',
    icon: Wrench,
    badge: 'Assembly',
    details: {
      input: 'Soldered Strands & Master Joint Rings',
      output: 'Continuous Linked Chain Mesh',
      lossMetrics: 'Link trimming scrap & joint micro-loss',
      keyFeatures: [
        'Batch-wise link count and pitch measurement',
        'Real-time weight balance before sending to weaving',
        'Defect rejection & instant rework return logging',
      ],
    },
  },
  {
    id: 'box',
    name: '5. Box Dept',
    shortDesc: 'Automated chain weaving & pattern calibration',
    icon: Package,
    badge: 'Weaving & Sizing',
    details: {
      input: 'Continuous Chain Mesh',
      output: 'Box, Rope, Figaro, Curb & Custom Pattern Chains',
      lossMetrics: 'Machine friction loss & link clipping scrap',
      keyFeatures: [
        'Machine-specific speed, pitch, and cycle counters',
        'Live loss variance alert for abnormal weight drops',
        'Multi-size categorization (16", 18", 20", 22", 24")',
      ],
    },
  },
  {
    id: 'cutting',
    name: '6. Diamond Cutting',
    shortDesc: 'High-speed diamond faceting & edge polishing',
    icon: Scissors,
    badge: 'Surface Faceting',
    details: {
      input: 'Woven Pattern Chains',
      output: 'High-Luster Diamond Faceted Chains',
      lossMetrics: 'Fine cutting dust recovery & suction filtration',
      keyFeatures: [
        'Diamond fly-wheel faceting depth parameter records',
        'Closed-loop gold dust suction recovery tracking',
        'Surface finish optical inspection status',
      ],
    },
  },
  {
    id: 'skunda',
    name: '7. S-Kunda & Finishing',
    shortDesc: 'Clasp fitting, final polish & hallmark testing',
    icon: Award,
    badge: 'Final Delivery',
    details: {
      input: 'Diamond Cut Chains + S-Kunda Hooks & Locks',
      output: 'Finished, Tagged, Hallmarked & Stock-Ready Chains',
      lossMetrics: 'Final ultrasonic buffing loss & tag weight net-off',
      keyFeatures: [
        'BIS Hallmark & XRF purity testing Stamp (शिक्का) verification',
        'Net fine gold certification and automatic barcode generation',
        'Direct 1-click handoff to Inventory Vault & Billing',
      ],
    },
  },
];

export const erpModules = [
  {
    title: 'Micro-Precision Fine Weight Ledger',
    desc: 'Automated calculation of Fine Gold = Gross Weight × (Purity / 100). Track bullion down to the milligram across all shifts and transfers.',
    icon: Scale,
    tag: 'Core Accounting',
  },
  {
    title: 'High-Speed Smart Billing & Invoicing',
    desc: 'Instant generation of detailed customer bills, draft receipts, thermal slips, and GST tax invoices with custom header branding.',
    icon: Printer,
    tag: 'Billing Engine',
  },
  {
    title: 'Vault & Real-Time Stock Management',
    desc: 'Live stock monitoring categorized by chain design, size, purity, fine weight, and safe vault storage location.',
    icon: Database,
    tag: 'Inventory Vault',
  },
  {
    title: 'Multi-Branch & Super Admin Portal',
    desc: 'Centralized multi-workshop governance, role-based access permissions, tenant management, and aggregate executive reports.',
    icon: Building2,
    tag: 'Enterprise Control',
  },
  {
    title: 'Cryptographic E-PIN License System',
    desc: 'Instant cloud & offline activation key generation, subscription expiration enforcement, and automated grace period renewals.',
    icon: Key,
    tag: 'Security & Licensing',
  },
  {
    title: 'Factory-Floor Offline-First Resilience',
    desc: 'Uninterrupted shop floor operations even during network outages, with automatic background sync when connectivity is restored.',
    icon: Zap,
    tag: 'Continuous Uptime',
  },
];

export const demoFeatures = [
  {
    title: '7-Stage Production Loss Tracking',
    desc: 'Melting to S-Kunda real-time scrap balance & yield logs.',
  },
  {
    title: 'Live Karat & Fine Gold Ledger',
    desc: 'Automatic fine gold conversion down to 0.001g precision.',
  },
  {
    title: 'Smart Invoicing & Thermal Printing',
    desc: 'Instant GST tax invoices and customer metal debit/credit ledgers.',
  },
  {
    title: 'Instant 7-Day Cloud Access',
    desc: 'Zero setup hurdles, zero obligations, no credit card required.',
  },
];

export const faqs = [
  {
    q: 'How does the ERP calculate and track manufacturing gold loss?',
    a: 'Every manufacturing department (Melting, Tar, Soldering, Joint, Box, Cutting, S-Kunda) records initial input weight, final output weight, recovered scrap, and suction dust. The platform calculates exact process loss percentage in real time and updates your fine gold ledger.',
  },
  {
    q: 'Can our factory floor workers use the ERP if internet connectivity drops?',
    a: 'Yes! The platform is built with an offline-first architecture. Operators can continue logging production batches, weighments, and job cards seamlessly without downtime. Data synchronizes automatically when network restores.',
  },
  {
    q: 'What is the E-PIN License Key system?',
    a: 'The E-PIN module enables Super Admins to generate cryptographic license keys with specific validity durations (e.g. 30 days, 1 year). Clients can enter the key in their billing portal to instantly unlock and extend their active subscription.',
  },
  {
    q: 'Does the billing module support both Draft and Finalized Invoices?',
    a: 'Yes. You can prepare draft receipts with live customer metal balances, fine weight conversions, labor charges (SRP), and payment modes, and then finalize them into formal printable bills with custom company header branding.',
  },
  {
    q: 'Can Super Admins manage multiple branches and workshops?',
    a: 'Absolutely. The Super Admin console allows creating separate admin accounts for different factory locations, setting distinct price/renewal terms, and monitoring aggregate bullion inventory across the entire business network.',
  },
];
