// Generated heuristics for ConversationEntry_b3e3231c1ed5.
export const hasIdAsString = (value) => typeof value.id === "string"; // The id property is a string identifying the conversation entry
export const hasTimestampAsNumber = (value) => typeof value.timestamp === "number" && Number.isFinite(value.timestamp); // The timestamp property is a finite number representing when the entry was created
export const hasSenderAsString = (value) => typeof value.sender === "string"; // The sender property is a string identifying who sent the message
export const hasMessageAsString = (value) => typeof value.message === "string"; // The message property is a string containing the message text
export const hasMetadataAsObject = (value) => value.metadata !== null && typeof value.metadata === "object" && !Array.isArray(value.metadata); // The metadata property is an object holding auxiliary data for the entry
