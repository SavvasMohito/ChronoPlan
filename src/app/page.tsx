"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/trpc/react";
import StaffList from "./_components/PeopleDropdown";

type Person = {
  id: string;
  name: string;
  role: "staff" | "client";
  services: string[];
  availability: { [day: string]: number[] };
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = Array.from({ length: 9 }, (_, i) => i + 13); // 13 (1 PM) to 21 (9 PM)

export default function UnifiedDashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [editedPerson, setEditedPerson] = useState<Person | null>(null);
  const [visiblePeople, setVisiblePeople] = useState<Set<string>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isSelecting, setIsSelecting] = useState(true);

  const insertStaff = api.staff.create.useMutation();
  const insertClient = api.clients.create.useMutation();

  useEffect(() => {
    if (selectedPersonId) {
      const person = people.find((p) => p.id === selectedPersonId);
      if (person) {
        setEditedPerson({ ...person });
      }
    } else {
      setEditedPerson(null);
    }
  }, [selectedPersonId, people]);

  const addNewPerson = () => {
    const newPerson: Person = {
      id: Date.now().toString(),
      name: "",
      role: "client",
      services: [],
      availability: {},
    };
    setPeople([...people, newPerson]);
    setSelectedPersonId(newPerson.id);
    setEditedPerson(newPerson);
  };

  const savePerson = async () => {
    if (!editedPerson) return;

    const updateMutation =
      editedPerson.role === "staff" ? insertStaff : insertClient;
    await updateMutation.mutateAsync({
      name: editedPerson.name,
      services: editedPerson.services,
      // availability: editedPerson.availability,
    });

    setPeople(people.map((p) => (p.id === editedPerson.id ? editedPerson : p)));
  };

  const handleMouseDown = (day: string, hour: number) => {
    if (!editedPerson) return;
    setIsMouseDown(true);
    setIsSelecting(!editedPerson.availability[day]?.includes(hour));
    toggleAvailability(day, hour);
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (isMouseDown) {
      if (isSelecting) {
        if (!editedPerson?.availability[day]?.includes(hour)) {
          toggleAvailability(day, hour);
        }
      } else {
        if (editedPerson?.availability[day]?.includes(hour)) {
          toggleAvailability(day, hour);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const toggleAvailability = (day: string, hour: number) => {
    if (!editedPerson) return;

    const updatedAvailability = { ...editedPerson.availability };
    const dayAvailability = updatedAvailability[day] || [];

    if (dayAvailability.includes(hour)) {
      updatedAvailability[day] = dayAvailability.filter((h) => h !== hour);
    } else {
      updatedAvailability[day] = [...dayAvailability, hour].sort(
        (a, b) => a - b,
      );
    }

    setEditedPerson({ ...editedPerson, availability: updatedAvailability });
  };

  const togglePersonVisibility = (personId: string) => {
    const newVisiblePeople = new Set(visiblePeople);
    if (newVisiblePeople.has(personId)) {
      newVisiblePeople.delete(personId);
    } else {
      newVisiblePeople.add(personId);
    }
    setVisiblePeople(newVisiblePeople);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">
        ChronoPlan - Schedules made easy
      </h1>

      <Tabs defaultValue="individual">
        <TabsList className="mb-4">
          <TabsTrigger value="individual">Individual View</TabsTrigger>
          <TabsTrigger value="global">Global View</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <StaffList />
          <div className="mb-4 flex justify-between">
            <Select
              value={selectedPersonId || ""}
              onValueChange={setSelectedPersonId}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select a person" />
              </SelectTrigger>
              <SelectContent>
                {people.map((person) => (
                  <SelectItem key={person.id} value={person.id}>
                    {person.name} ({person.role})
                  </SelectItem>
                ))}
                <SelectItem value="new">Add New Person</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={savePerson} disabled={!editedPerson}>
              Save Changes
            </Button>
          </div>

          {editedPerson && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editedPerson.id === "new" ? "Add New Person" : "Edit Person"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={editedPerson.name}
                      onChange={(e) =>
                        setEditedPerson({
                          ...editedPerson,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RadioGroup
                      value={editedPerson.role}
                      onValueChange={(value: "staff" | "client") =>
                        setEditedPerson({ ...editedPerson, role: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="client" id="edit-client" />
                        <Label htmlFor="edit-client">Client</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="staff" id="edit-staff" />
                        <Label htmlFor="edit-staff">Staff</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="services">Services (comma-separated)</Label>
                    <Input
                      id="services"
                      value={editedPerson.services.join(", ")}
                      onChange={(e) =>
                        setEditedPerson({
                          ...editedPerson,
                          services: e.target.value
                            .split(",")
                            .map((s) => s.trim()),
                        })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Availability</Label>
                    <div
                      className="overflow-x-auto"
                      onMouseLeave={handleMouseUp}
                      onMouseUp={handleMouseUp}
                    >
                      <table className="min-w-full">
                        <thead>
                          <tr>
                            <th className="px-4 py-2">Hour</th>
                            {days.map((day) => (
                              <th key={day} className="px-4 py-2">
                                {day}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {hours.map((hour) => (
                            <tr key={hour}>
                              <td className="px-4 py-2">{hour}:00</td>
                              {days.map((day) => (
                                <td
                                  key={`${day}-${hour}`}
                                  className={`cursor-pointer border px-4 py-2 ${
                                    (
                                      editedPerson.availability[day] || []
                                    ).includes(hour)
                                      ? "bg-primary"
                                      : "bg-background"
                                  }`}
                                  onMouseDown={() => handleMouseDown(day, hour)}
                                  onMouseEnter={() =>
                                    handleMouseEnter(day, hour)
                                  }
                                  role="gridcell"
                                  aria-selected={(
                                    editedPerson.availability[day] || []
                                  ).includes(hour)}
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      toggleAvailability(day, hour);
                                    }
                                  }}
                                />
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle>Global Availability View</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <h3 className="mb-2 text-lg font-semibold">
                  Toggle Visibility
                </h3>
                <div className="flex flex-wrap gap-4">
                  {people.map((person) => (
                    <div
                      key={person.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`visibility-${person.id}`}
                        checked={visiblePeople.has(person.id)}
                        onCheckedChange={() =>
                          togglePersonVisibility(person.id)
                        }
                      />
                      <Label htmlFor={`visibility-${person.id}`}>
                        {person.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-2">Hour</th>
                      {days.map((day) => (
                        <th key={day} className="px-4 py-2">
                          {day}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hours.map((hour) => (
                      <tr key={hour}>
                        <td className="px-4 py-2">{hour}:00</td>
                        {days.map((day) => (
                          <td
                            key={`${day}-${hour}`}
                            className="border px-4 py-2"
                          >
                            {people
                              .filter(
                                (person) =>
                                  visiblePeople.has(person.id) &&
                                  person.availability[day]?.includes(hour),
                              )
                              .map((person) => person.name)
                              .join(", ")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
