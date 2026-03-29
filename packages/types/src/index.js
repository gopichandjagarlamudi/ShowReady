export const CORE_QUESTION_ORDER = [
    "timeline",
    "financing",
    "budgetBand",
    "exclusiveAgent",
    "moveReasons",
    "priorShowings",
    "offerReadiness",
    "notes"
];
export const CORE_QUESTIONS = [
    {
        key: "timeline",
        label: "What is your timeline to move?",
        helperText: "This helps your agent prioritize the search.",
        type: "single_select",
        options: [
            { label: "ASAP", value: "asap" },
            { label: "1–3 months", value: "1_3mo" },
            { label: "3–6 months", value: "3_6mo" },
            { label: "6–12 months", value: "6_12mo" },
            { label: "Just exploring", value: "exploring" }
        ]
    },
    {
        key: "financing",
        label: "Have you been pre-approved for a mortgage?",
        type: "single_select",
        options: [
            { label: "Paying cash", value: "cash" },
            { label: "Yes, pre-approved", value: "pre_approved" },
            { label: "In progress", value: "in_progress" },
            { label: "Not yet", value: "no" }
        ]
    },
    {
        key: "budgetBand",
        label: "What is your rough budget range?",
        type: "single_select",
        options: [
            { label: "Under $200k", value: "under_200k" },
            { label: "$200k–$400k", value: "200k_400k" },
            { label: "$400k–$600k", value: "400k_600k" },
            { label: "$600k–$800k", value: "600k_800k" },
            { label: "$800k–$1M", value: "800k_1m" },
            { label: "$1M+", value: "1m_plus" }
        ]
    },
    {
        key: "exclusiveAgent",
        label: "Are you currently working with another agent?",
        type: "single_select",
        options: [
            { label: "No", value: "no" },
            { label: "Yes, but not exclusive", value: "yes_not_exclusive" },
            { label: "Yes, exclusively", value: "yes_exclusive" }
        ]
    },
    {
        key: "moveReasons",
        label: "What is the main reason for your move?",
        type: "multi_select",
        options: [
            { label: "Job change", value: "job_change" },
            { label: "Upsizing", value: "upsizing" },
            { label: "Downsizing", value: "downsizing" },
            { label: "Investment", value: "investment" },
            { label: "Relocation", value: "relocation" },
            { label: "Lifestyle", value: "lifestyle" },
            { label: "Lease ending", value: "lease_ending" }
        ]
    },
    {
        key: "priorShowings",
        label: "Have you visited any properties in person yet?",
        type: "single_select",
        options: [
            { label: "Yes, many", value: "many" },
            { label: "A few", value: "few" },
            { label: "None yet", value: "none" }
        ]
    },
    {
        key: "offerReadiness",
        label: "How ready are you to make an offer?",
        helperText: "1 means just researching, 5 means ready to offer today.",
        type: "slider",
        min: 1,
        max: 5,
        step: 1
    },
    {
        key: "notes",
        label: "Anything else you want your agent to know?",
        helperText: "Optional. Keep it short and practical.",
        type: "textarea"
    }
];
export const DEFAULT_TEMPLATE = {
    id: "default-template",
    name: "ShowReady Standard",
    introHeadline: "A quick step before your first showing",
    introBody: "This takes about two minutes and helps your agent focus on homes that actually fit your timeline and budget.",
    customQuestions: []
};
export const NAVIGATION_ITEMS = [
    { href: "/dashboard", label: "Dashboard", icon: "layout-dashboard" },
    { href: "/leads", label: "Leads", icon: "users" },
    { href: "/settings", label: "Settings", icon: "settings-2" }
];
