import { atom } from "jotai";
import Cookies from "js-cookie";

// atoms for foundation kit

export const institutionsAtom = atom([]);
export const usersAtom = atom([]);
export const userGroupsAtom = atom([]);

// Environment atom - hardcoded to sandbox for sandbox portal
// For production portal, change this to always return "production"
export const athenaEnvironmentAtom = atom("sandbox");
