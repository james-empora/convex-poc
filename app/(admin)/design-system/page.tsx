import {
  Search,
  FileText,
  DollarSign,
  Package,
  Shield,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TagInput } from "@/components/composite/tag-input";
import { RadioCards } from "@/components/composite/radio-cards";
import { SegmentedControl } from "@/components/composite/segmented-control";
import { AnimateOnScroll } from "./_demos/animate-on-scroll";
import { SwitchesDemo } from "./_demos/switches-demo";
import { TabPanelDemo } from "./_demos/tab-panel-demo";
import { ChatInputDemo } from "./_demos/chat-input-demo";
import { AlertDialogDemo } from "./_demos/alert-dialog-demo";
import { DataTableDemo } from "./_demos/data-table-demo";
/* ---------- helpers ---------- */

function ColorSwatch({
  name,
  hex,
  className,
}: {
  name: string;
  hex: string;
  className: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`h-14 w-14 rounded-xl border border-onyx-20 transition-transform duration-200 hover:scale-110 ${className}`}
      />
      <span className="text-sm font-medium text-foreground">{name}</span>
      <span className="font-mono text-xs text-muted-foreground">{hex}</span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block font-heading text-base font-medium italic text-garnet-60">
      {children}
    </span>
  );
}

/* ---------- page ---------- */

export default function Home() {
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Sub-navigation */}
      <nav className="sticky top-0 z-30 flex items-center gap-8 border-b border-onyx-20 bg-onyx-5/85 px-8 py-3 backdrop-blur-xl">
        <a
          href="#features"
          className="text-sm font-medium text-onyx-60 transition-colors hover:text-foreground"
        >
          Features
        </a>
        <a
          href="#palette"
          className="text-sm font-medium text-onyx-60 transition-colors hover:text-foreground"
        >
          Colors
        </a>
        <a
          href="#typography"
          className="text-sm font-medium text-onyx-60 transition-colors hover:text-foreground"
        >
          Typography
        </a>
        <a
          href="#components"
          className="text-sm font-medium text-onyx-60 transition-colors hover:text-foreground"
        >
          Components
        </a>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden px-8 py-24 lg:py-32">
        {/* Subtle background gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sapphire-10/40 via-transparent to-transparent" />
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-sapphire-20/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-amethyst-10/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl">
          <div className="animate-fade-up">
            <Badge
              variant="glass"
              className="mb-6 bg-sapphire-10 text-sapphire-70 border-sapphire-30/40"
            >
              Design System 2026
            </Badge>
          </div>
          <h1 className="animate-fade-up stagger-1 max-w-3xl font-heading text-5xl font-bold tracking-tight text-onyx-100 lg:text-7xl">
            Title & Escrow,{" "}
            <span className="text-garnet-60">Simplified</span>
          </h1>
          <p className="animate-fade-up stagger-2 mt-6 max-w-2xl text-xl leading-relaxed text-onyx-60">
            Empora brings unparalleled communication, efficiency, and visibility
            to the closing process — built for real estate investors who need
            speed and clarity.
          </p>
          <div className="animate-fade-up stagger-3 mt-10 flex flex-wrap gap-4">
            <Button size="lg" asChild>
              <a href="#features">Get Started</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#components">View Components</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-8 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll>
            <SectionLabel>What We Do</SectionLabel>
            <h2 className="max-w-xl font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Everything from search to recording
            </h2>
            <p className="mt-3 max-w-xl text-lg text-onyx-60">
              A full-stack title and escrow platform built for speed, clarity,
              and investor-grade visibility.
            </p>
          </AnimateOnScroll>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
            {[
              {
                icon: Search,
                title: "Title Search & Curative",
                desc: "Clear-to-close plans with automated issue tracking, lien and judgment workflows, and break-in-chain resolution.",
              },
              {
                icon: FileText,
                title: "Closing & Signing",
                desc: "Coordinated closings with signing appointments, notary scheduling, and document package management.",
              },
              {
                icon: DollarSign,
                title: "Ledger & Disbursements",
                desc: "Party-balanced settlement statements with automated line items, payment tracking, and reconciliation.",
              },
              {
                icon: Package,
                title: "Post-Closing & Recording",
                desc: "E-recording via Simplifile, document shipment tracking, and post-closing workflow automation.",
              },
              {
                icon: Shield,
                title: "File Intelligence",
                desc: "Wire change monitoring, prior file history, fraud indicators, and property occupancy data.",
              },
              {
                icon: Users,
                title: "Investor Portal",
                desc: "Customer-facing portal for file visibility, document access, and real-time closing status updates.",
              },
            ].map((feature) => (
              <AnimateOnScroll key={feature.title}>
                <Card className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
                  <CardContent className="p-6 lg:p-8">
                    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sapphire-10">
                      <feature.icon className="h-5 w-5 text-sapphire-60" />
                    </div>
                    <h3 className="font-heading text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-2 leading-relaxed text-onyx-60">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              </AnimateOnScroll>
            ))}
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Color Palette */}
      <section id="palette" className="bg-white px-8 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll>
            <SectionLabel>Visual Language</SectionLabel>
            <h2 className="max-w-xl font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Color System
            </h2>
            <p className="mt-3 max-w-xl text-lg text-onyx-60">
              Sapphire primary, Onyx neutrals, and semantic variants — designed
              for clarity and WCAG AA compliance.
            </p>
          </AnimateOnScroll>

          <div className="mt-12 space-y-10">
            {/* Onyx */}
            <AnimateOnScroll>
              <h3 className="mb-1 font-heading text-xl font-semibold">Onyx</h3>
              <p className="mb-5 text-onyx-60">
                Neutrals — backgrounds, text, borders
              </p>
              <div className="flex flex-wrap gap-5">
                <ColorSwatch name="5" hex="#FBF9F7" className="bg-onyx-5" />
                <ColorSwatch name="10" hex="#F9F5F2" className="bg-onyx-10" />
                <ColorSwatch name="20" hex="#EEE9E6" className="bg-onyx-20" />
                <ColorSwatch name="30" hex="#DCD6D2" className="bg-onyx-30" />
                <ColorSwatch name="40" hex="#C5BEB9" className="bg-onyx-40" />
                <ColorSwatch name="50" hex="#ACA39C" className="bg-onyx-50" />
                <ColorSwatch name="60" hex="#978D87" className="bg-onyx-60" />
                <ColorSwatch name="70" hex="#726C68" className="bg-onyx-70" />
                <ColorSwatch name="80" hex="#55514E" className="bg-onyx-80" />
                <ColorSwatch name="90" hex="#393633" className="bg-onyx-90" />
                <ColorSwatch
                  name="100"
                  hex="#23211E"
                  className="bg-onyx-100"
                />
              </div>
            </AnimateOnScroll>

            {/* Sapphire */}
            <AnimateOnScroll>
              <h3 className="mb-1 font-heading text-xl font-semibold">
                Sapphire
              </h3>
              <p className="mb-5 text-onyx-60">
                Primary interactive — buttons, links, focus
              </p>
              <div className="flex flex-wrap gap-5">
                <ColorSwatch
                  name="10"
                  hex="#F1F4FF"
                  className="bg-sapphire-10"
                />
                <ColorSwatch
                  name="20"
                  hex="#E4EBFF"
                  className="bg-sapphire-20"
                />
                <ColorSwatch
                  name="30"
                  hex="#CAD6FD"
                  className="bg-sapphire-30"
                />
                <ColorSwatch
                  name="40"
                  hex="#A6BAFF"
                  className="bg-sapphire-40"
                />
                <ColorSwatch
                  name="50"
                  hex="#809DFF"
                  className="bg-sapphire-50"
                />
                <ColorSwatch
                  name="60"
                  hex="#4670FF"
                  className="bg-sapphire-60"
                />
                <ColorSwatch
                  name="70"
                  hex="#3455D3"
                  className="bg-sapphire-70"
                />
                <ColorSwatch
                  name="80"
                  hex="#293E8D"
                  className="bg-sapphire-80"
                />
                <ColorSwatch
                  name="90"
                  hex="#27335E"
                  className="bg-sapphire-90"
                />
                <ColorSwatch
                  name="100"
                  hex="#262B3E"
                  className="bg-sapphire-100"
                />
              </div>
            </AnimateOnScroll>

            {/* Garnet */}
            <AnimateOnScroll>
              <h3 className="mb-1 font-heading text-xl font-semibold">
                Garnet
              </h3>
              <p className="mb-5 text-onyx-60">
                Brand accent — use sparingly in app UI
              </p>
              <div className="flex flex-wrap gap-5">
                <ColorSwatch
                  name="10"
                  hex="#FFF0F2"
                  className="bg-garnet-10"
                />
                <ColorSwatch
                  name="20"
                  hex="#FFE0E3"
                  className="bg-garnet-20"
                />
                <ColorSwatch
                  name="30"
                  hex="#FFC7CD"
                  className="bg-garnet-30"
                />
                <ColorSwatch
                  name="40"
                  hex="#FFA3AB"
                  className="bg-garnet-40"
                />
                <ColorSwatch
                  name="50"
                  hex="#FF7783"
                  className="bg-garnet-50"
                />
                <ColorSwatch
                  name="60"
                  hex="#FC4A5A"
                  className="bg-garnet-60"
                />
                <ColorSwatch
                  name="70"
                  hex="#DC183C"
                  className="bg-garnet-70"
                />
                <ColorSwatch
                  name="80"
                  hex="#B71A37"
                  className="bg-garnet-80"
                />
                <ColorSwatch
                  name="90"
                  hex="#6A1424"
                  className="bg-garnet-90"
                />
                <ColorSwatch
                  name="100"
                  hex="#451F26"
                  className="bg-garnet-100"
                />
              </div>
            </AnimateOnScroll>

            {/* Amethyst */}
            <AnimateOnScroll>
              <h3 className="mb-1 font-heading text-xl font-semibold">
                Amethyst
              </h3>
              <p className="mb-5 text-onyx-60">Supporting color</p>
              <div className="flex flex-wrap gap-5">
                <ColorSwatch
                  name="10"
                  hex="#F9F7FF"
                  className="bg-amethyst-10"
                />
                <ColorSwatch
                  name="20"
                  hex="#EBE3FF"
                  className="bg-amethyst-20"
                />
                <ColorSwatch
                  name="30"
                  hex="#DFD3FF"
                  className="bg-amethyst-30"
                />
                <ColorSwatch
                  name="40"
                  hex="#C6B1FF"
                  className="bg-amethyst-40"
                />
                <ColorSwatch
                  name="50"
                  hex="#B193FF"
                  className="bg-amethyst-50"
                />
                <ColorSwatch
                  name="60"
                  hex="#9670FF"
                  className="bg-amethyst-60"
                />
                <ColorSwatch
                  name="70"
                  hex="#704DCC"
                  className="bg-amethyst-70"
                />
                <ColorSwatch
                  name="80"
                  hex="#573E97"
                  className="bg-amethyst-80"
                />
                <ColorSwatch
                  name="90"
                  hex="#3C296E"
                  className="bg-amethyst-90"
                />
                <ColorSwatch
                  name="100"
                  hex="#302844"
                  className="bg-amethyst-100"
                />
              </div>
            </AnimateOnScroll>

            {/* Semantic */}
            <AnimateOnScroll>
              <h3 className="mb-1 font-heading text-xl font-semibold">
                Semantic Variants
              </h3>
              <p className="mb-5 text-onyx-60">Status indicators</p>
              <div className="flex flex-wrap items-center gap-5">
                <ColorSwatch
                  name="Success 80"
                  hex="#01827A"
                  className="bg-success-80"
                />
                <ColorSwatch
                  name="Success 60"
                  hex="#37D7CD"
                  className="bg-success-60"
                />
                <ColorSwatch
                  name="Success 20"
                  hex="#E0FFFD"
                  className="bg-success-20"
                />
                <Separator
                  orientation="vertical"
                  className="mx-2 hidden h-14 sm:block"
                />
                <ColorSwatch
                  name="Warning 80"
                  hex="#886A00"
                  className="bg-warning-80"
                />
                <ColorSwatch
                  name="Warning 60"
                  hex="#E2B30D"
                  className="bg-warning-60"
                />
                <ColorSwatch
                  name="Warning 20"
                  hex="#FFF9E2"
                  className="bg-warning-20"
                />
                <Separator
                  orientation="vertical"
                  className="mx-2 hidden h-14 sm:block"
                />
                <ColorSwatch
                  name="Danger 80"
                  hex="#CE180C"
                  className="bg-danger-80"
                />
                <ColorSwatch
                  name="Danger 60"
                  hex="#FE695F"
                  className="bg-danger-60"
                />
                <ColorSwatch
                  name="Danger 20"
                  hex="#FFECEB"
                  className="bg-danger-20"
                />
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Typography */}
      <section id="typography" className="px-8 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll>
            <SectionLabel>Type System</SectionLabel>
            <h2 className="max-w-xl font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Typography
            </h2>
            <p className="mt-3 max-w-xl text-lg text-onyx-60">
              Red Hat Display for headings, Red Hat Text for body, Red Hat Mono
              for data — all optimized via next/font.
            </p>
          </AnimateOnScroll>

          <div className="mt-12 space-y-8">
            {/* Display font */}
            <AnimateOnScroll>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-onyx-20 px-6 py-4 lg:px-8">
                  <span className="text-xs font-semibold tracking-widest uppercase text-onyx-60">
                    Red Hat Display
                  </span>
                  <span className="rounded-full bg-onyx-10 px-3 py-1 font-mono text-xs text-onyx-60">
                    Headings · Titles
                  </span>
                </div>
                <div className="space-y-4 p-6 lg:p-8">
                  <h1 className="font-heading text-5xl font-bold tracking-tight lg:text-6xl">
                    The quick brown fox
                  </h1>
                  <h2 className="font-heading text-3xl font-semibold tracking-tight">
                    Jumps over the lazy dog
                  </h2>
                  <h3 className="font-heading text-xl font-medium">
                    Title and escrow, simplified
                  </h3>
                </div>
                <div className="space-y-3 border-t border-onyx-20 px-6 py-5 lg:px-8">
                  <div className="flex items-baseline gap-4">
                    <span className="min-w-[80px] text-right font-mono text-xs text-onyx-50">
                      6xl / 60px
                    </span>
                    <span className="font-heading text-4xl font-bold tracking-tight">
                      Display
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="min-w-[80px] text-right font-mono text-xs text-onyx-50">
                      4xl / 36px
                    </span>
                    <span className="font-heading text-3xl font-semibold tracking-tight">
                      Heading 1
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="min-w-[80px] text-right font-mono text-xs text-onyx-50">
                      2xl / 24px
                    </span>
                    <span className="font-heading text-2xl font-semibold">
                      Heading 2
                    </span>
                  </div>
                  <div className="flex items-baseline gap-4">
                    <span className="min-w-[80px] text-right font-mono text-xs text-onyx-50">
                      xl / 20px
                    </span>
                    <span className="font-heading text-xl font-medium">
                      Heading 3
                    </span>
                  </div>
                </div>
              </Card>
            </AnimateOnScroll>

            {/* Body font */}
            <AnimateOnScroll>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-onyx-20 px-6 py-4 lg:px-8">
                  <span className="text-xs font-semibold tracking-widest uppercase text-onyx-60">
                    Red Hat Text
                  </span>
                  <span className="rounded-full bg-onyx-10 px-3 py-1 font-mono text-xs text-onyx-60">
                    Light 300 · Regular 400 · Medium 500 · SemiBold 600
                  </span>
                </div>
                <div className="space-y-4 p-6 lg:p-8">
                  <p className="text-2xl font-light tracking-tight text-onyx-80">
                    Clean, geometric, and quietly confident.
                  </p>
                  <p className="max-w-prose text-lg leading-relaxed text-onyx-70">
                    Red Hat Text provides the warm foundation for all body text,
                    UI labels, and interface copy. Its open letterforms maintain
                    legibility at small sizes while its geometric character feels
                    contemporary without the coldness of purely technical
                    typefaces.
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>

            {/* Mono font */}
            <AnimateOnScroll>
              <Card className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-onyx-20 px-6 py-4 lg:px-8">
                  <span className="text-xs font-semibold tracking-widest uppercase text-onyx-60">
                    Red Hat Mono
                  </span>
                  <span className="rounded-full bg-onyx-10 px-3 py-1 font-mono text-xs text-onyx-60">
                    Code · Data · IDs
                  </span>
                </div>
                <div className="p-6 lg:p-8">
                  <p className="font-mono text-base leading-loose text-sapphire-80">
                    File #24-1847 | File ID: 8f3a2b1c
                    <br />
                    Settlement: $425,000.00
                    <br />
                    Recording Fee: $245.00
                  </p>
                </div>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Components */}
      <section id="components" className="bg-white px-8 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll>
            <SectionLabel>Building Blocks</SectionLabel>
            <h2 className="max-w-xl font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Components
            </h2>
            <p className="mt-3 max-w-xl text-lg text-onyx-60">
              Core interface elements — generous radii, subtle depth, and
              micro-interactions that feel tactile and alive.
            </p>
          </AnimateOnScroll>

          <div className="mt-12 space-y-10">
            {/* Buttons */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Buttons
                  </CardTitle>
                  <CardDescription className="text-base">
                    Hover for lift effect, click for press feedback. Sapphire
                    glow on primary variant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 lg:px-8">
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-wider text-onyx-50">
                      Variants
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button>Primary</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-wider text-onyx-50">
                      Sizes
                    </p>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button size="xs">Extra Small</Button>
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Badges */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">Badges</CardTitle>
                  <CardDescription className="text-base">
                    Status and category indicators using semantic color tokens.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 lg:px-8">
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-wider text-onyx-50">
                      File Status
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="glass" className="bg-sapphire-10 text-sapphire-80 border-sapphire-40/30">Opened</Badge>
                      <Badge variant="glass" className="bg-warning-20 text-warning-80 border-warning-60/30">In Curative</Badge>
                      <Badge variant="glass" className="bg-success-20 text-success-80 border-success-60/30">Clear to Close</Badge>
                      <Badge variant="glass" className="bg-amethyst-20 text-amethyst-80 border-amethyst-40/30">Signing</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-wider text-onyx-50">
                      File Type
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="glass" className="bg-sapphire-20 text-sapphire-80 border-sapphire-40/30">Purchase</Badge>
                      <Badge variant="glass" className="bg-success-20 text-success-80 border-success-60/30">Refinance</Badge>
                      <Badge variant="glass" className="bg-garnet-20 text-garnet-80 border-garnet-40/30">Wholesale</Badge>
                      <Badge variant="glass" className="bg-amethyst-20 text-amethyst-80 border-amethyst-40/30">PASA</Badge>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="mb-3 text-sm font-medium uppercase tracking-wider text-onyx-50">
                      Default Variants
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <Badge>Default</Badge>
                      <Badge variant="secondary">Secondary</Badge>
                      <Badge variant="outline">Outline</Badge>
                      <Badge variant="destructive">Destructive</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Inputs & Form Fields */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Form Fields
                  </CardTitle>
                  <CardDescription className="text-base">
                    Soft Sapphire glow on focus instead of hard borders. Click
                    into any field to see the effect.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6 lg:px-8">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-onyx-70">
                          File Number
                        </label>
                        <Input placeholder="Search by file number..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-onyx-70">
                          Property Address
                        </label>
                        <Input placeholder="123 Main Street, City, State" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-onyx-70">
                          Email
                        </label>
                        <Input type="email" placeholder="you@company.com" />
                      </div>
                    </div>
                    <div className="space-y-5">
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-onyx-70">
                          File Type
                        </label>
                        <Select>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select file type" />
                          </SelectTrigger>
                          <SelectContent position="popper" sideOffset={4}>
                            <SelectItem value="purchase">Purchase</SelectItem>
                            <SelectItem value="refinance">Refinance</SelectItem>
                            <SelectItem value="wholesale">Wholesale</SelectItem>
                            <SelectItem value="pasa">PASA</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-onyx-70">
                          Notes
                        </label>
                        <Textarea placeholder="Add any notes about this file..." />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-onyx-50">
                          Disabled
                        </label>
                        <Input disabled placeholder="Disabled input" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Switches & Toggles */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Switches
                  </CardTitle>
                  <CardDescription className="text-base">
                    Toggle controls instead of checkboxes — cleaner, more
                    tactile, and immediately communicates on/off state.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8">
                  <SwitchesDemo />
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Tag Input */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Tag Input
                  </CardTitle>
                  <CardDescription className="text-base">
                    Multi-select with deletable tags — type and press Enter to
                    add, click the X to remove. No dropdowns, no checkboxes.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-onyx-70">
                        Counties
                      </label>
                      <TagInput
                        placeholder="Type a county name and press Enter..."
                        defaultTags={["Franklin", "Delaware", "Licking"]}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-onyx-70">
                        Assignees
                      </label>
                      <TagInput
                        placeholder="Add team members..."
                        defaultTags={["Sarah K.", "Mike R."]}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Selection Controls */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Selection Controls
                  </CardTitle>
                  <CardDescription className="text-base">
                    Card-style radio buttons and segmented controls — no bare
                    dots or default browser radios.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8 px-6 lg:px-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <div>
                      <label className="mb-4 block text-sm font-medium text-onyx-70">
                        Closing Type
                      </label>
                      <RadioCards
                        name="closing-type"
                        defaultValue="standard"
                        options={[
                          {
                            value: "standard",
                            label: "Standard Closing",
                            description:
                              "Full title search and curative process",
                          },
                          {
                            value: "rush",
                            label: "Rush Closing",
                            description: "Expedited 3-day turnaround",
                          },
                          {
                            value: "super-rush",
                            label: "Super Rush",
                            description: "Same-day priority processing",
                          },
                        ]}
                      />
                    </div>
                    <div className="space-y-8">
                      <div>
                        <label className="mb-4 block text-sm font-medium text-onyx-70">
                          View
                        </label>
                        <div>
                          <SegmentedControl
                            name="view-mode"
                            defaultValue="list"
                            options={[
                              { value: "list", label: "List" },
                              { value: "board", label: "Board" },
                              { value: "calendar", label: "Calendar" },
                            ]}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-4 block text-sm font-medium text-onyx-70">
                          Time Range
                        </label>
                        <div>
                          <SegmentedControl
                            name="time-range"
                            defaultValue="30d"
                            options={[
                              { value: "7d", label: "7 days" },
                              { value: "30d", label: "30 days" },
                              { value: "90d", label: "90 days" },
                              { value: "all", label: "All time" },
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Tabbed Content Well */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Tabbed Content Well
                  </CardTitle>
                  <CardDescription className="text-base">
                    VS Code-style tabs — drag to reorder, double-click to
                    rename, X to close. Try it out below.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8">
                  <TabPanelDemo />
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Chat Input */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Chat Input
                  </CardTitle>
                  <CardDescription className="text-base">
                    LLM prompt box — model selection, thinking toggle, file
                    drag-and-drop, keyboard shortcuts. Send triggers a simulated
                    3-second generation.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8">
                  <ChatInputDemo />
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Glass Modal */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Glass Modal
                  </CardTitle>
                  <CardDescription className="text-base">
                    Fullscreen blurred backdrop with a glass-effect dialog.
                    No titlebar — just icon, text, and actions. Click a button
                    to try each variant.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8">
                  <AlertDialogDemo />
                </CardContent>
              </Card>
            </AnimateOnScroll>

            {/* Data Table */}
            <AnimateOnScroll>
              <Card>
                <CardHeader className="px-6 lg:px-8">
                  <CardTitle className="font-heading text-xl">
                    Data Table
                  </CardTitle>
                  <CardDescription className="text-base">
                    Sortable columns, filter, custom cell renderers, three-dot
                    action menu, and right-click context menu. Try sorting,
                    filtering by property, or right-clicking a row.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6 lg:px-8">
                  <DataTableDemo />
                </CardContent>
              </Card>
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      <Separator className="mx-auto max-w-6xl" />

      {/* Tech Stack */}
      <section className="px-8 py-20 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <AnimateOnScroll>
            <SectionLabel>Stack</SectionLabel>
            <h2 className="font-heading text-3xl font-bold tracking-tight lg:text-4xl">
              Built With
            </h2>
            <div className="mt-8 flex flex-wrap gap-3">
              {[
                "Next.js 16",
                "React 19",
                "TypeScript",
                "Tailwind CSS v4",
                "shadcn/ui",
                "Convex",
                "Jotai",
                "React Hook Form",
                "Zod",
                "Vercel Blob",
                "Vercel Workflow",
              ].map((tech) => (
                <Badge
                  key={tech}
                  variant="secondary"
                  className="px-4 py-1.5 text-sm"
                >
                  {tech}
                </Badge>
              ))}
            </div>
          </AnimateOnScroll>
        </div>
      </section>

    </div>
  );
}
