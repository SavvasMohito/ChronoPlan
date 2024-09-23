import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


type TimeSlot = [number, number];  // Tuple representing (day, time) e.g. (0, 1345)

class Person {
    name: string;
    availability: TimeSlot[];

    constructor(name: string, availability: TimeSlot[]) {
        this.name = name;
        this.availability = availability;
    }
}

class Teacher extends Person {
    subject: string;

    constructor(name: string, availability: TimeSlot[], subject: string) {
        super(name, availability);
        this.subject = subject;
    }
}

class Student extends Person {
    subjects: string[];

    constructor(name: string, availability: TimeSlot[], subjects: string[]) {
        super(name, availability);
        this.subjects = subjects;
    }
}

function formatTime(slot: number): string {
    const hour = Math.floor(slot / 100);
    const minute = slot % 100;
    const endMinute = minute + 45;
    const endHour = hour + Math.floor(endMinute / 60);
    const formattedEndMinute = endMinute % 60;
    return `${hour}:${minute.toString().padStart(2, '0')} - ${endHour}:${formattedEndMinute.toString().padStart(2, '0')}`;
}

function formatDay(dayNum: number): string {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    return days[dayNum];
}

function findAppointments(teachers: Teacher[], students: Student[], timeSlots: TimeSlot[], maxClassrooms: number): [string, string, string, string, string][] {
    const appointments: [string, string, string, string, string][] = [];
    const slotUsage: Map<string, number> = new Map();
    const personUsage: Map<string, boolean> = new Map();
    const studentSubjectSchedule: Map<string, Map<string, number>> = new Map();

    timeSlots.sort();

    // Initialize student subject schedule
    students.forEach(student => {
        const subjectMap = new Map<string, number>();
        student.subjects.forEach(subject => subjectMap.set(subject, 0));
        studentSubjectSchedule.set(student.name, subjectMap);
    });

    for (const student of students) {
        for (const subject of student.subjects) {
            let lessonsScheduled = 0;

            for (let i = 0; i < timeSlots.length; i++) {
                const [day, slot] = timeSlots[i];
                if (lessonsScheduled >= 2) break;

                const nextSlot = slot + 45;
                if (!timeSlots.some(([tDay, tSlot]) => tDay === day && tSlot === nextSlot)) continue;

                const nextTimeSlot: TimeSlot = [day, nextSlot];
                if (student.availability.some(([tDay, tSlot]) => tDay === day && tSlot === slot) &&
                    student.availability.some(([tDay, tSlot]) => tDay === day && tSlot === nextSlot)) {

                    if ((studentSubjectSchedule.get(student.name)?.get(subject) || 0) >= 1) continue;

                    const availableTeachers = teachers.filter(teacher =>
                        teacher.subject === subject &&
                        teacher.availability.some(([tDay, tSlot]) => tDay === day && tSlot === slot) &&
                        teacher.availability.some(([tDay, tSlot]) => tDay === day && tSlot === nextSlot)
                    );

                    for (const teacher of availableTeachers) {
                        if (
                            personUsage.get(`${teacher.name}_${day}_${slot}`) ||
                            personUsage.get(`${student.name}_${day}_${slot}`) ||
                            personUsage.get(`${teacher.name}_${day}_${nextSlot}`) ||
                            personUsage.get(`${student.name}_${day}_${nextSlot}`)
                        ) continue;

                        if ((slotUsage.get(`${day}_${slot}`) || 0) >= maxClassrooms ||
                            (slotUsage.get(`${day}_${nextSlot}`) || 0) >= maxClassrooms) continue;

                        appointments.push([teacher.name, student.name, formatDay(day), formatTime(slot), subject]);
                        studentSubjectSchedule.get(student.name)!.set(subject, (studentSubjectSchedule.get(student.name)!.get(subject) || 0) + 1);
                        slotUsage.set(`${day}_${slot}`, (slotUsage.get(`${day}_${slot}`) || 0) + 1);
                        personUsage.set(`${teacher.name}_${day}_${slot}`, true);
                        personUsage.set(`${student.name}_${day}_${slot}`, true);

                        let otherSubjectScheduled = false;

                        for (const otherSubject of student.subjects) {
                            if (otherSubject === subject || (studentSubjectSchedule.get(student.name)?.get(otherSubject) || 0) >= 2) continue;

                            const otherAvailableTeachers = teachers.filter(teacher =>
                                teacher.subject === otherSubject &&
                                teacher.availability.some(([tDay, tSlot]) => tDay === day && tSlot === nextSlot)
                            );

                            for (const teacher of otherAvailableTeachers) {
                                if (
                                    personUsage.get(`${teacher.name}_${day}_${nextSlot}`) ||
                                    personUsage.get(`${student.name}_${day}_${nextSlot}`)
                                ) continue;

                                if ((slotUsage.get(`${day}_${nextSlot}`) || 0) >= maxClassrooms) continue;

                                appointments.push([teacher.name, student.name, formatDay(day), formatTime(nextSlot), otherSubject]);
                                studentSubjectSchedule.get(student.name)!.set(otherSubject, (studentSubjectSchedule.get(student.name)!.get(otherSubject) || 0) + 1);
                                slotUsage.set(`${day}_${nextSlot}`, (slotUsage.get(`${day}_${nextSlot}`) || 0) + 1);
                                personUsage.set(`${teacher.name}_${day}_${nextSlot}`, true);
                                personUsage.set(`${student.name}_${day}_${nextSlot}`, true);

                                lessonsScheduled += 2;
                                otherSubjectScheduled = true;
                                break;
                            }

                            if (otherSubjectScheduled) break;
                        }

                        if (lessonsScheduled >= 2) break;
                    }
                }
            }
        }
    }

    return appointments;
}

// Define available time slots (from 13:45 to 21:15 in 45-minute intervals, for each day of the week)
const timeSlots: TimeSlot[] = [
    ...Array.from({ length: 7 }, (_, day) => [day, 1345] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1430] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1515] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1600] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1645] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1730] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1815] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1900] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 1945] as TimeSlot),
    ...Array.from({ length: 7 }, (_, day) => [day, 2030] as TimeSlot)
];

// Example teacher and student availability (general availability without subject-specific slots)
const teachers: Teacher[] = [
    new Teacher("Teacher1", [[0, 1345], [0, 1515], [2, 1600], [4, 1730]], "Math"),
    new Teacher("Teacher2", [[1, 1515], [3, 1645], [4, 1730], [5, 1900]], "English"),
    new Teacher("Teacher3", [[2, 1345], [2, 1600], [5, 1900], [6, 2030]], "History"),
    new Teacher("Teacher4", [[2, 1345], [2, 1515], [4, 1730]], "Physics")
];

const students: Student[] = [
    new Student("Student1", [[0, 1345], [0, 1515], [2, 1600], [4, 1730]], ["Math", "English"]),
    new Student("Student2", [[1, 1515], [3, 1645], [4, 1730], [5, 1900]], ["History", "Physics"]),
    new Student("Student3", [[2, 1345], [2, 1600], [5, 1900], [6, 2030]], ["Math", "History"]),
    new Student("Student4", [[2, 1345], [2, 1515], [4, 1730]], ["English", "Physics"]),
];

// Find appointments with a limit of 2 classrooms
const appointments = findAppointments(teachers, students, timeSlots, 2);

// Print the generated timetable
console.log("Generated Timetable:");
appointments.forEach(([teacher, student, day, time, subject]) => {
    console.log(`${day}, ${time}: ${teacher} with ${student} for ${subject}`);
});
