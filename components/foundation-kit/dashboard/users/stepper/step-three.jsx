"use client";

import { fetchInstitutionalUserGroups } from "@/components/foundation-kit/dashboard/user-groups/user-group-table";
import Combobox from "@/components/ui/combobox";
import { useAtom } from "jotai";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";
import { addUserAtom } from "../UserDialog";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";

export function StepThree({ userData, mode }) {
  const [selected, setSelected] = useState([]);
  const [addUser, setAddUser] = useAtom(addUserAtom);
  const [userGroups, setUserGroups] = useState([]);
  const selectedInstitutionId = Cookies.get("selectedInstitution");

  const loadAllUserGroups = async () => {
    const { data } = await axiosInstance.get(`/dashboard/user-groups/`);
    setUserGroups(data);
  };

  useEffect(() => {
    const loadUserGroups = async () => {
      const institutionIds = addUser?.institution;
      const userGroups = await Promise.all(
        institutionIds.map(async (institutionId) => {
          const data = await fetchInstitutionalUserGroups(institutionId);
          return data;
        })
      );
      const mergedUserGroups = userGroups.flat();
      const uniqueUserGroups = mergedUserGroups.filter(
        (userGroup, index, self) =>
          index === self.findIndex((t) => t.id === userGroup.id)
      );
      setUserGroups(uniqueUserGroups);
    };

    if (addUser?.institution.length > 0) {
      loadUserGroups();
    } else {
      loadAllUserGroups();
    }
  }, [addUser?.institution]);

  useEffect(() => {
    if (mode === "edit" && userGroups.length > 0) {
      // setSelected(
      //   userGroups?.map((userGroup) => ({
      //     value: userGroup.id,
      //     label: userGroup.name,
      //   }))
      // );
      setSelected(
        userGroups
          ?.filter((userGroup) =>
            userData?.roles?.some((role) => role === userGroup.id)
          )
          ?.map((userGroup) => ({
            value: userGroup.id,
            label: userGroup.name,
          }))
      );
    }
  }, [userGroups, mode, userData]);

  useEffect(() => {
    setAddUser({
      ...addUser,
      userGroup: selected.map((userGroup) => userGroup.value),
    });
  }, [selected]);

  const options = userGroups.map((userGroup) => ({
    value: userGroup.id,
    label: userGroup.name,
  }));
  return (
    <div className="p-10 w-full">
      <Combobox
        options={options}
        selected={selected}
        setSelected={setSelected}
        placeholder="user group"
      />
    </div>
  );
}
