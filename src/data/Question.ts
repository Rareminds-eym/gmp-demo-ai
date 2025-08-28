
export interface HackathonPrompt {
  id: number;
  description: string;
}

export const hackathonPrompts: HackathonPrompt[] = [
  {
    id: 1,
    description: "I want to solve '___' for '___' by '___'",
  },
  {
    id: 2,
    description: "What issue or need are you addressing? Who faces this problem?",
  },
  {
    id: 3,
    description: "What tool, app, software, machine, or digital aid can make your solution stronger?",
  },
  {
    id: 4,
    description: "Who can you team up with (friends, other departments, communities) to make this idea bigger?",
  },
  {
    id: 5,
    description: "What unique feature, design, or new approach makes your idea stand out?",
  },
  {
    id: 6,
    description: "How can your solution be applied quickly? Can it be scaled to help many people (beyond your college/community)?",
  },
  {
    id: 7,
    description: "How does your idea create value? (Social, environmental, educational, or economic impact?)",
  },
  {
    id: 8,
    description: "Our innovation solves '___' by using '___', built with '___', adding '___'. It can grow with '___' and will create '___'.",
  },
  {
    id: 10,
    description: "What did you learn, what would you improve?",
  }
];


// Helper function to get prompt by id
export const getPromptById = (id: number): HackathonPrompt | undefined => {
  return hackathonPrompts.find(prompt => prompt.id === id);
};