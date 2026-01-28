"use client";

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
  } from "@/components/ui/accordion";
import { motion } from "framer-motion";

const FAQS = [
    {
        q: "Can you truly audit 100% of calls at scale?",
        a: "Yes. Our ingestion pipeline and workflow orchestration support full coverage with SLA-based turnaround, replacing legacy random sampling methods."
    },
    {
        q: "What counts as an 'audit'?",
        a: "One completed assessment of a call against your configured QA framework wth parameter scoring, defect tagging, and report inclusion."
    },
    {
        q: "Do you support multi-language audits?",
        a: "Yes—we support configurable parameters per language/campaign and language-based routing for accurate transcription and analysis."
    },
    {
        q: "How are TNIs generated?",
        a: "Smart TNIs are generated automatically from defect patterns, fatal flags, and parameter non-compliance trends, mapped directly to specific learning themes."
    },
    {
        q: "Can we customize scoring logic?",
        a: "Absolutely. Weights, mandatory checks, fatal fail logic, and Green/Amber/Red (GAR) thresholds are all fully configurable via the dashboard."
    },
    {
        q: "What’s the onboarding time?",
        a: "Typical go-live is 5–10 business days, depending on integration complexity and QA form calibration requirements."
    },
    {
        q: "Do you provide calibration & governance support?",
        a: "Yes—calibration workshops, rebuttal workflows, and governance templates are included as optional add-ons to ensuring scoring alignment."
    }
];

export const FAQSection = () => {
    return (
        <section className="py-24 container px-4 sm:px-6 max-w-4xl mx-auto">
            <div className="text-center mb-16">
                 <h2 className="text-3xl text-neutral-900 dark:text-white font-bold tracking-tight mb-4">
                     Common Questions
                 </h2>
                 <p className="text-neutral-600 dark:text-muted-foreground">
                     Everything you need to know about autonomous QA.
                 </p>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
                {FAQS.map((faq, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <AccordionItem value={`item-${i}`} className="border border-neutral-200 dark:border-white/10 bg-white dark:bg-white/[0.02] rounded-lg px-4 shadow-sm dark:shadow-none">
                            <AccordionTrigger className="text-neutral-900 dark:text-white hover:no-underline hover:text-indigo-600 dark:hover:text-primary transition-colors text-left">
                                {faq.q}
                            </AccordionTrigger>
                            <AccordionContent className="text-neutral-600 dark:text-muted-foreground leading-relaxed">
                                {faq.a}
                            </AccordionContent>
                        </AccordionItem>
                    </motion.div>
                ))}
            </Accordion>
        </section>
    );
};
