import React from "react";
import { api } from "@/trpc/react";

const StaffList = () => {
  // Using the tRPC hook to fetch staff data
  const { data, isLoading, error } = api.staff.getAll.useQuery();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      {data?.map((staffMember) => (
        <div key={staffMember.id}>
          <h2>{staffMember.name}</h2>
          <p>Services: {staffMember.services.join(", ")}</p>
        </div>
      ))}
    </div>
  );
};

export default StaffList;
