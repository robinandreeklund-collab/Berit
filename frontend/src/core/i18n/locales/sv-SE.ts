import {
  CompassIcon,
  GraduationCapIcon,
  ImageIcon,
  MicroscopeIcon,
  PenLineIcon,
  ShapesIcon,
  SparklesIcon,
  VideoIcon,
} from "lucide-react";

import type { Translations } from "./types";

export const svSE: Translations = {
  // Locale meta
  locale: {
    localName: "Svenska",
  },

  // Common
  common: {
    home: "Hem",
    settings: "Inställningar",
    delete: "Radera",
    rename: "Byt namn",
    share: "Dela",
    openInNewWindow: "Öppna i nytt fönster",
    close: "Stäng",
    more: "Mer",
    search: "Sök",
    download: "Ladda ner",
    thinking: "Tänker",
    artifacts: "Artefakter",
    public: "Publika",
    custom: "Anpassade",
    notAvailableInDemoMode: "Inte tillgängligt i demoläge",
    loading: "Laddar...",
    version: "Version",
    lastUpdated: "Senast uppdaterad",
    code: "Kod",
    preview: "Förhandsgranskning",
    cancel: "Avbryt",
    save: "Spara",
    install: "Installera",
    create: "Skapa",
  },

  // Welcome
  welcome: {
    greeting: "Hej, välkommen tillbaka!",
    description:
      "Välkommen till 🦌 DeerFlow, en öppen superagent. Med inbyggda och anpassade färdigheter kan DeerFlow hjälpa dig att söka på webben, analysera data och skapa artefakter som presentationer, webbsidor och nästan vad som helst.",

    createYourOwnSkill: "Skapa din egen färdighet",
    createYourOwnSkillDescription:
      "Skapa din egen färdighet för att frigöra DeerFlows fulla potential. Med anpassade färdigheter\nkan DeerFlow hjälpa dig att söka på webben, analysera data och skapa\nartefakter som presentationer, webbsidor och nästan vad som helst.",
  },

  // Clipboard
  clipboard: {
    copyToClipboard: "Kopiera till urklipp",
    copiedToClipboard: "Kopierat till urklipp",
    failedToCopyToClipboard: "Misslyckades att kopiera till urklipp",
    linkCopied: "Länk kopierad till urklipp",
  },

  // Input Box
  inputBox: {
    placeholder: "Hur kan jag hjälpa dig idag?",
    createSkillPrompt:
      "Vi ska bygga en ny färdighet steg för steg med `skill-creator`. Till att börja med, vad vill du att färdigheten ska göra?",
    addAttachments: "Lägg till bilagor",
    mode: "Läge",
    flashMode: "Blixt",
    flashModeDescription: "Snabbt och effektivt, men kanske inte helt exakt",
    reasoningMode: "Resonemang",
    reasoningModeDescription:
      "Tänker innan handling, balans mellan tid och precision",
    proMode: "Pro",
    proModeDescription:
      "Resonerar, planerar och utför, ger mer exakta resultat, kan ta längre tid",
    ultraMode: "Ultra",
    ultraModeDescription:
      "Pro-läge med underagenter för arbetsdelning; bäst för komplexa flerstegsuppgifter",
    reasoningEffort: "Resonemangsdjup",
    reasoningEffortMinimal: "Minimalt",
    reasoningEffortMinimalDescription: "Hämtning + direktutmatning",
    reasoningEffortLow: "Lågt",
    reasoningEffortLowDescription: "Enkel logikkontroll + ytlig härledning",
    reasoningEffortMedium: "Medel",
    reasoningEffortMediumDescription:
      "Flerlagers logikanalys + grundläggande verifiering",
    reasoningEffortHigh: "Högt",
    reasoningEffortHighDescription:
      "Fullständig logisk härledning + flervägsverifiering + bakåtkontroll",
    searchModels: "Sök modeller...",
    surpriseMe: "Överraska",
    surpriseMePrompt: "Överraska mig",
    followupLoading: "Genererar uppföljningsfrågor...",
    followupConfirmTitle: "Skicka förslag?",
    followupConfirmDescription:
      "Du har redan text i inmatningsfältet. Välj hur du vill skicka.",
    followupConfirmAppend: "Lägg till och skicka",
    followupConfirmReplace: "Ersätt och skicka",
    suggestions: [
      {
        suggestion: "Skriv",
        prompt: "Skriv ett blogginlägg om de senaste trenderna inom [ämne]",
        icon: PenLineIcon,
      },
      {
        suggestion: "Undersök",
        prompt:
          "Gör en djupgående undersökning om [ämne] och sammanfatta resultaten.",
        icon: MicroscopeIcon,
      },
      {
        suggestion: "Samla",
        prompt: "Samla in data från [källa] och skapa en rapport.",
        icon: ShapesIcon,
      },
      {
        suggestion: "Lär dig",
        prompt: "Lär dig om [ämne] och skapa en handledning.",
        icon: GraduationCapIcon,
      },
    ],
    suggestionsCreate: [
      {
        suggestion: "Webbsida",
        prompt: "Skapa en webbsida om [ämne]",
        icon: CompassIcon,
      },
      {
        suggestion: "Bild",
        prompt: "Skapa en bild om [ämne]",
        icon: ImageIcon,
      },
      {
        suggestion: "Video",
        prompt: "Skapa en video om [ämne]",
        icon: VideoIcon,
      },
      {
        type: "separator",
      },
      {
        suggestion: "Färdighet",
        prompt:
          "Vi ska bygga en ny färdighet steg för steg med `skill-creator`. Till att börja med, vad vill du att färdigheten ska göra?",
        icon: SparklesIcon,
      },
    ],
  },

  // Sidebar
  sidebar: {
    newChat: "Ny chatt",
    chats: "Chattar",
    recentChats: "Senaste chattar",
    demoChats: "Demochatt",
    agents: "Agenter",
  },

  // Agents
  agents: {
    title: "Agenter",
    description:
      "Skapa och hantera anpassade agenter med specialiserade promptar och förmågor.",
    newAgent: "Ny agent",
    emptyTitle: "Inga anpassade agenter ännu",
    emptyDescription:
      "Skapa din första anpassade agent med en specialiserad systemprompt.",
    chat: "Chatta",
    delete: "Radera",
    deleteConfirm:
      "Är du säker på att du vill radera denna agent? Åtgärden kan inte ångras.",
    deleteSuccess: "Agent raderad",
    newChat: "Ny chatt",
    createPageTitle: "Designa din agent",
    createPageSubtitle:
      "Beskriv agenten du vill ha — jag hjälper dig skapa den genom en konversation.",
    nameStepTitle: "Namnge din nya agent",
    nameStepHint:
      "Endast bokstäver, siffror och bindestreck — lagras i gemener (t.ex. kod-granskare)",
    nameStepPlaceholder: "t.ex. kod-granskare",
    nameStepContinue: "Fortsätt",
    nameStepInvalidError:
      "Ogiltigt namn — använd endast bokstäver, siffror och bindestreck",
    nameStepAlreadyExistsError: "En agent med detta namn finns redan",
    nameStepCheckError:
      "Kunde inte verifiera namntillgänglighet — försök igen",
    nameStepBootstrapMessage:
      "Den nya agentens namn är {name}. Nu skapar vi dess **SOUL**.",
    agentCreated: "Agent skapad!",
    startChatting: "Börja chatta",
    backToGallery: "Tillbaka till galleriet",
  },

  // Breadcrumb
  breadcrumb: {
    workspace: "Arbetsyta",
    chats: "Chattar",
  },

  // Workspace
  workspace: {
    officialWebsite: "DeerFlows officiella webbplats",
    githubTooltip: "DeerFlow på Github",
    settingsAndMore: "Inställningar och mer",
    visitGithub: "DeerFlow på GitHub",
    reportIssue: "Rapportera ett problem",
    contactUs: "Kontakta oss",
    about: "Om DeerFlow",
  },

  // Conversation
  conversation: {
    noMessages: "Inga meddelanden ännu",
    startConversation: "Starta en konversation för att se meddelanden här",
  },

  // Chats
  chats: {
    searchChats: "Sök chattar",
  },

  // Page titles (document title)
  pages: {
    appName: "DeerFlow",
    chats: "Chattar",
    newChat: "Ny chatt",
    untitled: "Namnlös",
  },

  // Tool calls
  toolCalls: {
    moreSteps: (count: number) => `${count} steg till`,
    lessSteps: "Färre steg",
    executeCommand: "Kör kommando",
    presentFiles: "Visa filer",
    needYourHelp: "Behöver din hjälp",
    useTool: (toolName: string) => `Använder verktyget "${toolName}"`,
    searchFor: (query: string) => `Söker efter "${query}"`,
    searchForRelatedInfo: "Söker efter relaterad information",
    searchForRelatedImages: "Söker efter relaterade bilder",
    searchForRelatedImagesFor: (query: string) =>
      `Söker efter relaterade bilder för "${query}"`,
    searchOnWebFor: (query: string) => `Söker på webben efter "${query}"`,
    viewWebPage: "Visa webbsida",
    listFolder: "Lista mapp",
    readFile: "Läs fil",
    writeFile: "Skriv fil",
    clickToViewContent: "Klicka för att visa filinnehåll",
    writeTodos: "Uppdatera att-göra-lista",
    skillInstallTooltip:
      "Installera färdighet och gör den tillgänglig i DeerFlow",
  },

  // Uploads
  uploads: {
    uploading: "Laddar upp...",
    uploadingFiles: "Laddar upp filer, vänligen vänta...",
  },

  // Subtasks
  subtasks: {
    subtask: "Deluppgift",
    executing: (count: number) =>
      `Utför ${count === 1 ? "" : count + " "}deluppgift${count === 1 ? "" : "er parallellt"}`,
    in_progress: "Kör deluppgift",
    completed: "Deluppgift klar",
    failed: "Deluppgift misslyckades",
  },

  // Settings
  settings: {
    title: "Inställningar",
    description: "Anpassa hur DeerFlow ser ut och beter sig för dig.",
    sections: {
      appearance: "Utseende",
      memory: "Minne",
      tools: "Verktyg",
      skills: "Färdigheter",
      prompts: "Promptar",
      notification: "Aviseringar",
      about: "Om",
    },
    memory: {
      title: "Minne",
      description:
        "DeerFlow lär sig automatiskt från dina konversationer i bakgrunden. Dessa minnen hjälper DeerFlow att förstå dig bättre och leverera en mer personlig upplevelse.",
      empty: "Ingen minnesdata att visa.",
      rawJson: "Rå JSON",
      markdown: {
        overview: "Översikt",
        userContext: "Användarkontext",
        work: "Arbete",
        personal: "Personligt",
        topOfMind: "Aktuellt fokus",
        historyBackground: "Historik",
        recentMonths: "Senaste månaderna",
        earlierContext: "Tidigare kontext",
        longTermBackground: "Långsiktig bakgrund",
        updatedAt: "Uppdaterad",
        facts: "Fakta",
        empty: "(tomt)",
        table: {
          category: "Kategori",
          confidence: "Konfidens",
          confidenceLevel: {
            veryHigh: "Mycket hög",
            high: "Hög",
            normal: "Normal",
            unknown: "Okänd",
          },
          content: "Innehåll",
          source: "Källa",
          createdAt: "Skapad",
          view: "Visa",
        },
      },
    },
    appearance: {
      themeTitle: "Tema",
      themeDescription:
        "Välj om gränssnittet ska följa din enhet eller vara fast.",
      system: "System",
      light: "Ljust",
      dark: "Mörkt",
      systemDescription:
        "Matcha operativsystemets inställning automatiskt.",
      lightDescription: "Ljus palett med högre kontrast för dagtid.",
      darkDescription: "Mörk palett som minskar bländning för fokus.",
      languageTitle: "Språk",
      languageDescription: "Växla mellan språk.",
    },
    tools: {
      title: "Verktyg",
      description:
        "Hantera konfiguration och aktiveringsstatus för MCP-verktyg.",
    },
    skills: {
      title: "Agentfärdigheter",
      description:
        "Hantera konfiguration och aktiveringsstatus för agentfärdigheter.",
      createSkill: "Skapa färdighet",
      emptyTitle: "Inga agentfärdigheter ännu",
      emptyDescription:
        "Lägg dina agentfärdighetsmappar under mappen `/skills/custom` i DeerFlows rotmapp.",
      emptyButton: "Skapa din första färdighet",
    },
    prompts: {
      title: "Promptar",
      description:
        "Visa och redigera alla promptmallar som används i agentflödet. Ändringar gäller direkt men återställs vid omstart.",
      loadError: "Kunde inte ladda promptar.",
      reset: "Återställ",
      saved: "Sparat!",
      runtimeNote:
        "Ändringar sparas i minnet och gäller direkt. De återställs vid omstart av servern.",
    },
    notification: {
      title: "Aviseringar",
      description:
        "DeerFlow skickar bara en avisering när fönstret inte är aktivt. Detta är särskilt användbart för långvariga uppgifter så att du kan byta till annat arbete och bli meddelad när det är klart.",
      requestPermission: "Begär aviseringsbehörighet",
      deniedHint:
        "Aviseringsbehörighet nekades. Du kan aktivera den i webbläsarens webbplatsinställningar för att ta emot aviseringar.",
      testButton: "Skicka testavisering",
      testTitle: "DeerFlow",
      testBody: "Detta är en testavisering.",
      notSupported: "Din webbläsare stöder inte aviseringar.",
      disableNotification: "Inaktivera aviseringar",
    },
    acknowledge: {
      emptyTitle: "Tack och erkännanden",
      emptyDescription:
        "Erkännanden och tack visas här.",
    },
  },
};
