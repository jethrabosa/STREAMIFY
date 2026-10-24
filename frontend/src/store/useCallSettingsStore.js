import { create } from "zustand";
import { DEFAULT_RINGTONE, RINGTONES } from "../constants/ringtones";

const savedRingtone = localStorage.getItem("call-ringtone");
const initialRingtone = Object.hasOwn(RINGTONES, savedRingtone)
  ? savedRingtone
  : DEFAULT_RINGTONE;

export const useCallSettingsStore = create((set) => ({
  ringtone: initialRingtone,
  setRingtone: (ringtone) => {
    if (!Object.hasOwn(RINGTONES, ringtone)) return;
    localStorage.setItem("call-ringtone", ringtone);
    set({ ringtone });
  },
}));
