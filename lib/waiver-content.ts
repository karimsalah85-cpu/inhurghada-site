/**
 * Diving liability waiver wording, versioned.
 *
 * ⚠️ TEMPLATE WORDING — NOT LEGAL ADVICE. ⚠️
 * Everything below is a generic starting point written for the website. Karim
 * must review it with his lawyer and against the partner SSI dive centre's
 * official liability release and medical statement BEFORE relying on it. The
 * medical questions are modelled on the topics of the RSTC / UHMS Diver
 * Medical Participant Questionnaire but are NOT that official form; a dive
 * centre may still require its own form to be signed on the day.
 *
 * Every signature stores `waiverVersion`, so when the text changes, bump the
 * version (e.g. "2026-11-15") and keep the old text in git history — a signed
 * row must always be traceable to the exact words the guest accepted.
 *
 * Structure: one `WaiverContent` per locale so translations can be added later
 * without touching the page or the submit route. English only for now.
 */

export const WAIVER_VERSION = "2026-10-01-template";

/** Shown to admins next to waiver status until the wording has been approved. */
export const WAIVER_IS_TEMPLATE = true;
export const waiverTemplateNotice =
  "Template wording: review with your lawyer and the SSI dive centre's official form before relying on these waivers.";

export type WaiverLocale = "en";

export type WaiverSection = { id: string; title: string; paragraphs: string[] };
export type MedicalQuestion = { id: string; text: string };
export type WaiverAcknowledgement = { id: string; text: string };

export type WaiverContent = {
  title: string;
  intro: string;
  sections: WaiverSection[];
  medicalIntro: string;
  medicalQuestions: MedicalQuestion[];
  medicalYesNote: string;
  /** All must be ticked to sign. */
  acknowledgements: WaiverAcknowledgement[];
  photoConsent: string;
  signatureLabel: string;
  signatureHelp: string;
};

const en: WaiverContent = {
  title: "Diving liability waiver and medical statement",
  intro:
    "Scuba diving and related water activities involve inherent risks. Please read this waiver carefully. Each diver (adults and children) must complete their own form. A parent or legal guardian must sign for anyone under 18.",
  sections: [
    {
      id: "assumption-of-risk",
      title: "1. Assumption of risk",
      paragraphs: [
        "I understand that scuba diving, snorkelling from a dive boat and boat travel involve risks including, but not limited to, decompression sickness, lung over-expansion injuries, drowning, barotrauma, injuries from marine life, equipment failure, sea and weather conditions, and injury while boarding, travelling on or leaving a boat.",
        "I understand that the dive site may be remote from medical facilities and a recompression chamber, and that emergency treatment may be delayed.",
        "I voluntarily choose to take part and I accept these risks.",
      ],
    },
    {
      id: "medical-fitness",
      title: "2. Medical fitness",
      paragraphs: [
        "I confirm that I am in good health and fit to dive, and that I have answered the medical questions below truthfully and completely.",
        "If I answer YES to any medical question, I understand that I must present written clearance from a physician before diving, and that the instructor or dive centre may refuse to let me dive.",
        "I will tell the crew about any change in my health, medication or condition before or during the trip. I will not dive under the influence of alcohol or drugs.",
      ],
    },
    {
      id: "instructions",
      title: "3. Following crew and instructor instructions",
      paragraphs: [
        "I agree to attend the briefing and to follow all instructions from the dive guides, instructors and boat crew, including depth and time limits, buddy procedures and safety stops.",
        "I understand that the dive leader may change or cancel a dive, or end my participation, for safety reasons, and that this decision is final.",
        "If I am a certified diver, I will dive within the limits of my training and experience.",
      ],
    },
    {
      id: "equipment",
      title: "4. Equipment",
      paragraphs: [
        "I will check the equipment I am given and tell the crew immediately about any problem. I will use it only as instructed.",
        "I am responsible for loss of, or damage to, rented equipment caused by misuse or negligence.",
      ],
    },
    {
      id: "release",
      title: "5. Release of liability",
      paragraphs: [
        "To the extent permitted by law, I release Daily Red Sea, the dive centre, their staff, instructors and boat crew from liability for injury, loss or damage arising from my participation, except where caused by their gross negligence or wilful misconduct.",
        "Nothing in this waiver excludes or limits liability that cannot be excluded or limited by law.",
      ],
    },
  ],
  medicalIntro: "Please answer every question. Answer YES if the condition applies to you now or has applied in the past where stated.",
  medicalQuestions: [
    { id: "heart", text: "Have you ever had heart problems, heart surgery, chest pain, or do you have high blood pressure?" },
    { id: "lungs", text: "Have you ever had asthma, wheezing, a collapsed lung (pneumothorax), or any other lung or breathing condition?" },
    { id: "ears", text: "Do you have ear or sinus problems, trouble equalising, or have you had ear or sinus surgery?" },
    { id: "neuro", text: "Have you ever had seizures, epilepsy, blackouts, fainting, a stroke, or a serious head injury?" },
    { id: "diabetes", text: "Do you have diabetes or any condition for which you take regular medication (other than contraception)?" },
    { id: "pregnancy", text: "Are you pregnant, or could you be pregnant?" },
    { id: "recent", text: "In the last 12 months, have you had surgery, been admitted to hospital, or had a diving accident or decompression sickness?" },
    { id: "mental", text: "Do you suffer from panic attacks, claustrophobia, or take medication that affects your alertness or judgement?" },
  ],
  medicalYesNote:
    "You answered YES to at least one medical question. You must bring written clearance from a doctor stating that you are fit to dive. Without it, the dive centre will not be able to take you diving. Daily Red Sea will contact you.",
  acknowledgements: [
    { id: "read", text: "I have read and understood this waiver and the medical statement." },
    { id: "truthful", text: "My medical answers are true and complete." },
    { id: "risk", text: "I accept the risks described and agree to follow the crew's and instructors' instructions." },
  ],
  photoConsent: "Optional: Daily Red Sea may use photos or videos taken during the trip in which I appear for its website and social media.",
  signatureLabel: "Signature — type your full name",
  signatureHelp: "Typing your name counts as your signature. For under-18s, a parent or legal guardian types their own name.",
};

export const waiverContent: Record<WaiverLocale, WaiverContent> = { en };

export function getWaiverContent(locale: string | null | undefined = "en"): WaiverContent {
  return waiverContent[(locale as WaiverLocale) in waiverContent ? (locale as WaiverLocale) : "en"];
}
