import { atom } from "jotai";
import Cookies from "js-cookie";

// atoms for foundation kit

export const institutionsAtom = atom([]);
export const usersAtom = atom([]);
export const userGroupsAtom = atom([]);

// Environment atom - hardcoded to production for production portal
// For sandbox portal, change this to "sandbox"
export const athenaEnvironmentAtom = atom("production");
