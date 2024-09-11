"use client";

import React, { useState, useRef } from "react";
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

type Person = {
  id: string;
  name: string;
  role: "teacher" | "student";
  subjects: string[];
  availability: { [day: string]: number[] };
};

const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const hours = Array.from({ length: 9 }, (_, i) => i + 13); // 13 (1 PM) to 21 (9 PM)

export default function UnifiedDashboard() {
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [newPerson, setNewPerson] = useState<Omit<Person, "id">>({
    name: "",
    role: "student",
    subjects: [],
    availability: {},
  });
  const [visiblePeople, setVisiblePeople] = useState<Set<string>>(new Set());
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isSelecting, setIsSelecting] = useState(true);
  const lastInteractedCell = useRef<string | null>(null);

  const selectedPerson = people.find((p) => p.id === selectedPersonId);

  const addPerson = () => {
    const person: Person = {
      ...newPerson,
      id: Date.now().toString(),
    };
    setPeople([...people, person]);
    setSelectedPersonId(person.id);
    setVisiblePeople(new Set(visiblePeople).add(person.id));
    setNewPerson({
      name: "",
      role: "student",
      subjects: [],
      availability: {},
    });
  };

  const updatePerson = (updatedPerson: Person) => {
    setPeople(
      people.map((p) => (p.id === updatedPerson.id ? updatedPerson : p)),
    );
  };

  const handleMouseDown = (day: string, hour: number) => {
    if (!selectedPerson) return;
    setIsMouseDown(true);
    setIsSelecting(!selectedPerson.availability[day]?.includes(hour));
    toggleAvailability(day, hour);
    lastInteractedCell.current = `${day}-${hour}`;
  };

  const handleMouseEnter = (day: string, hour: number) => {
    if (isMouseDown && `${day}-${hour}` !== lastInteractedCell.current) {
      if (isSelecting) {
        if (!selectedPerson?.availability[day]?.includes(hour)) {
          toggleAvailability(day, hour);
        }
      } else {
        if (selectedPerson?.availability[day]?.includes(hour)) {
          toggleAvailability(day, hour);
        }
      }
      lastInteractedCell.current = `${day}-${hour}`;
    }
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const toggleAvailability = (day: string, hour: number) => {
    if (!selectedPerson) return;

    const updatedAvailability = { ...selectedPerson.availability };
    const dayAvailability = updatedAvailability[day] || [];

    if (dayAvailability.includes(hour)) {
      updatedAvailability[day] = dayAvailability.filter((h) => h !== hour);
    } else {
      updatedAvailability[day] = [...dayAvailability, hour].sort(
        (a, b) => a - b,
      );
    }

    updatePerson({ ...selectedPerson, availability: updatedAvailability });
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
        Unified Availability Dashboard
      </h1>

      <Tabs defaultValue="individual">
        <TabsList className="mb-4">
          <TabsTrigger value="individual">Individual View</TabsTrigger>
          <TabsTrigger value="global">Global View</TabsTrigger>
        </TabsList>

        <TabsContent value="individual">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Add New Person</CardTitle>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    addPerson();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={newPerson.name}
                      onChange={(e) =>
                        setNewPerson({ ...newPerson, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <RadioGroup
                      value={newPerson.role}
                      onValueChange={(value: "teacher" | "student") =>
                        setNewPerson({ ...newPerson, role: value })
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="student" id="new-student" />
                        <Label htmlFor="new-student">Student</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="teacher" id="new-teacher" />
                        <Label htmlFor="new-teacher">Teacher</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subjects">Subjects (comma-separated)</Label>
                    <Input
                      id="subjects"
                      value={newPerson.subjects.join(", ")}
                      onChange={(e) =>
                        setNewPerson({
                          ...newPerson,
                          subjects: e.target.value
                            .split(",")
                            .map((s) => s.trim()),
                        })
                      }
                      required
                    />
                  </div>
                  <Button type="submit">Add Person</Button>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Edit Person</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedPersonId || ""}
                  onValueChange={setSelectedPersonId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a person" />
                  </SelectTrigger>
                  <SelectContent>
                    {people.map((person) => (
                      <SelectItem key={person.id} value={person.id}>
                        {person.name} ({person.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPerson && (
                  <div className="mt-4">
                    <h3 className="mb-2 text-lg font-semibold">
                      {selectedPerson.name}'s Details
                    </h3>
                    <p>Role: {selectedPerson.role}</p>
                    <p>Subjects: {selectedPerson.subjects.join(", ")}</p>

                    <h3 className="mb-2 mt-4 text-lg font-semibold">
                      Availability
                    </h3>
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
                                      selectedPerson.availability[day] || []
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
                                    selectedPerson.availability[day] || []
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
                )}
              </CardContent>
            </Card>
          </div>
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
