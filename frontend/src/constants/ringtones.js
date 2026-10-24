export const RINGTONES = {
  classic: {
    label: "Classic",
    frequencies: [440, 480],
    pattern: [350, 250, 350, 1050],
  },
  digital: {
    label: "Digital",
    frequencies: [660, 880],
    pattern: [150, 100, 150, 1600],
  },
  gentle: {
    label: "Gentle",
    frequencies: [523],
    pattern: [450, 1550],
  },
};

export const DEFAULT_RINGTONE = "classic";

export const getRingtone = (name) =>
  RINGTONES[name] || RINGTONES[DEFAULT_RINGTONE];
