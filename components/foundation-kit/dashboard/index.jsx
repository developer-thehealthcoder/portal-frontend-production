"use client";
import { useEffect, useState } from "react";
import { boxArray } from "./data";
import axiosInstance from "@/lib/foundation-kit/axiosInstance";
import Link from "next/link";

const AnalysisBox = ({ number, name, icon }) => {
  return (
    <div
      className={`cursor-pointer border-2 border-gray-300 flex w-64 items-center gap-5 ps-5 py-3 rounded-lg mb-5`}
    >
      <div className="h-[50px] w-[100px] relative">{icon}</div>
      <div>
        <div className="font-bold text-xl">{number}</div>
        <div className="text-sm font-semibold">{name}</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [count, setCount] = useState();
  useEffect(() => {
    const fetchCount = async () => {
      const { data } = await axiosInstance.get("/dashboard/count/");
      setCount(data?.count);
    };
    fetchCount();
  }, []);
  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {count &&
          boxArray(count).map((item, index) => (
            <Link key={index} href={item.link}>
              <AnalysisBox
                number={item.number}
                name={item.name}
                icon={item.icon}
              />
            </Link>
          ))}
      </div>
      {/* <Tabs defaultValue="users" className="w-full">
        <TabsList>
          <TabsTrigger value="users">Users Data</TabsTrigger>
          <TabsTrigger value="dummy">Dummy Tab</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <DataTableDemo />
        </TabsContent>
        <TabsContent value="dummy">Change your dummy value here..</TabsContent>
      </Tabs> */}
    </div>
  );
};

export default Dashboard;
