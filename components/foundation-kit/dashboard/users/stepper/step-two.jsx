"use client";

import Combobox from "@/components/ui/combobox";
import { useState, useEffect, use } from "react";
import { useAtom } from "jotai";
import { addUserAtom } from "../UserDialog";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";

async function fetchInstitutions() {
  try {
    const { data } = await axiosInstance.get("/dashboard/institutions/");
    return data;
  } catch (error) {
    console.error("Error fetching institutions:", error);
    return [];
  }
}
const fetchInstitutionsPromise = fetchInstitutions();

export function StepTwo({ userData, mode }) {
  const [selected, setSelected] = useState([]);
  const [addUser, setAddUser] = useAtom(addUserAtom);
  const institutions = use(fetchInstitutionsPromise);

  useEffect(() => {
    if (mode === "edit") {
      const fetchUserInstitutions = async () => {
        try {
          const { data } = await axiosInstance.get(
            `/dashboard/user-institutions/${userData?.id}`
          );
          const userInstitutions = data?.institutions;

          setSelected(
            userInstitutions?.map((institution) => ({
              value: institution.id,
              label: institution.name,
            }))
          );
        } catch (error) {
          console.error("Error fetching user institutions:", error);
        }
      };
      fetchUserInstitutions();
    }
  }, [userData, mode]);

  useEffect(() => {
    setAddUser({
      ...addUser,
      institution: selected?.map((institution) => institution.value),
    });
  }, [selected]);

  const options = institutions?.map((institution) => ({
    value: institution.id,
    label: institution.name,
  }));
  return (
    <div className="p-10 w-full">
      <Combobox
        options={options}
        selected={selected}
        setSelected={setSelected}
        placeholder="institution"
      />
    </div>
  );
}
