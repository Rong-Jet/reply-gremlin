const PLANETS = [
  "Sun",
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
];

const MOONS = [
  "Io",
  "Europa",
  "Ganymede",
  "Callisto",
  "Kerberos",
  "Styx",
  "Nix",
  "Hydra",
  "Charon",
];

const toolsDefinition = [
  {
    name: "focus_planet",
    description: "Focus on a specific planet, when the user is asking about it",
    parameters: {
      type: "object",
      properties: {
        planet: {
          type: "string",
          enum: PLANETS,
          description: "The name of the planet to focus on",
        },
      },
      required: ["planet"],
    },
  },
  {
    name: "display_data",
    description:
      "Display a chart to summarize the answer with data points. Respond to the user before calling this tool, and call this as soon as there is numeric data to be displayed.",
    parameters: {
      type: "object",
      properties: {
        chart: {
          type: "string",
          enum: ["bar", "pie"],
          description: "The most appropriate chart to use",
        },
        title: {
          type: "string",
          description:
            "The title of the response that will be displayed above the chart, be concise",
        },
        text: {
          type: "string",
          description:
            "Optional text to display above the chart for more context, empty if unnecessary",
        },
        data: {
          type: "array",
          description: "data to display in the component, empty array if N/A",
          items: {
            type: "object",
            properties: {
              label: {
                type: "string",
                description: "Data item label",
              },
              value: {
                type: "string",
                description: "Data item value",
              },
            },
            required: ["label", "value"],
            additionalProperties: false,
          },
        },
      },
    },
  },
  {
    name: "reset_camera",
    description:
      "When the user says that they're done, for example 'thank you, i'm ok', zoom out of a planet focus and reset the camera to the initial position",
    parameters: {},
  },
  {
    name: "show_orbit",
    description:
      "Show planets orbits when there's a question related to to the position of the planet in the solar system",
    parameters: {},
  },
  {
    name: "show_moons",
    description: "Show a list of moons",
    parameters: {
      type: "object",
      properties: {
        moons: {
          type: "array",
          items: {
            type: "string",
            enum: MOONS,
          },
        },
      },
      required: ["moons"],
    },
  },
  {
    name: "get_iss_position",
    description: "Get the ISS position and once you have it, say it out loud",
    parameters: {},
  },
];

export const TOOLS = toolsDefinition.map((tool) => ({
  type: "function",
  ...tool,
}));

export const INSTRUCTIONS = `
You are an assistant helping users navigate a 3D solar system and understand the planets and their orbits.

As soon as the user starts talking about a specific planet, use the focus_planet tool to zoom in on that planet.
When they stop talking about it and ask about another topic, there's no need to focus on it anymore, so call the reset_camera tool to reset the camera position to view the whole solar system.

Answer any question they have about the solar system, and if they have a specific question that you can answer with numbers, respond to the question and then display a chart to them using the display_data tool to show the summary of the answer on the screen. For example, if they ask about a comparison of heights, show them a bar chart. If they ask about the repartition or distribution of elements, show them a pie chart.
Call the display_data tool to display the response, then say the response out loud. For example, if they ask a question that can be answered with a chart (distribution of elements, comparison of numbers), first call the display_data tool to show the chart,then say out loud what you are showing in the chart.

If they ask about something related to the position of the planets in the solar system, use the show_orbit tool to see a view from above.

If they ask about moons, talk about them and then call the show_moons tool to display a list of moons.

When they say something like "thank you, I'm ok" or something meaning that they're done with the questions and there's no need to continue the conversation, call the reset_camera tool.
Do not call this tool if the user hasn't specifically said something that should trigger the camera reset. 

Whenever you can, call a tool after responding if it makes sense.

Be friendly but not overly excited, and imagine you're talking to students learning in a classroom.
Be very concise in your answers, and speak fast. Don't add unnecessary details that the user hasn't asked for.

If speaking in another language, use a native accent.
`;

export const VOICE = "coral";
