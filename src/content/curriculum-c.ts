import type { Lesson, Module } from "@/content/types";

/**
 * Module 09: Insider risk.
 * Supports NIST SP 800-53 AT-2(2), NIST SP 800-171 3.2.3, and CMMC AT.L2-3.2.3
 * (recognize and report potential indicators of insider threat). CMMC assesses this practice
 * separately, so it is its own module with its own completion record.
 */

export const MODULES_C: Module[] = [
  {
    id: "insider",
    num: "09",
    title: "Insider risk",
    summary: "Watch behavior, not people. Report what you saw through the real path, and leave the investigating to the people whose job it is.",
  },
];

export const LESSONS_C: Lesson[] = [
  {
    id: "insider-indicators",
    moduleId: "insider",
    title: "Behavior, not a profile",
    minutes: 5,
    fieldRule: "Report what someone did with access, never who you think they are.",
    sections: [
      {
        heading: "Most insider harm is not a spy",
        paragraphs: [
          "An insider is anyone with legitimate access: staff, contractors, temps, the vendor with a badge. Most damage they cause is careless or coerced, not planned. A rushed upload to a personal drive, a login sold by a stranger who stole it, a favor done for a friend. Intent matters to investigators. It does not change what you report.",
        ],
      },
      {
        heading: "Indicators you can actually see",
        paragraphs: [
          "Access to files or systems that have nothing to do with the job. Large downloads, or copying drawings, customer lists, or controlled data to USB sticks, personal email, or personal cloud. Asking for access they do not need, or for someone else's login. Working around controls: turning off a laptop agent, sharing badges, propping doors. Badge or login activity at hours that make no sense for the role. Saying out loud they plan to take data with them, or to get even.",
        ],
      },
      {
        heading: "What is not an indicator",
        paragraphs: [
          "Accent, religion, politics, a divorce, a bad week, a quiet personality. None of those are behaviors with access, and none of them belong in a report. A list of feelings about a coworker is gossip with a subject line. A specific action you saw, with the time and place, is something security can check.",
        ],
      },
    ],
    questions: [
      {
        id: "insider-indicators-q1",
        prompt: "Which of these is an insider-risk indicator worth reporting?",
        choices: [
          "A coworker who keeps to himself at lunch",
          "A planner copying a folder of engineering drawings to a personal USB stick",
          "Someone who complained about the parking policy",
          "A new hire who asks a lot of questions",
        ],
        answer: 1,
        why: "Moving controlled files to personal storage is an observable action with access. Personality and complaints are not.",
      },
      {
        id: "insider-indicators-q2",
        prompt: "Most harm from insiders comes from",
        choices: [
          "Foreign agents placed years in advance",
          "Careless, rushed, or coerced use of real access",
          "Executives only",
          "People who fail the annual training",
        ],
        answer: 1,
        why: "The common case is a person with real access doing something unsafe, by mistake or under pressure. That is why ordinary staff are the ones who notice.",
      },
      {
        id: "insider-indicators-q3",
        prompt: "A good insider-risk report describes",
        choices: [
          "Why you never trusted the person",
          "What the person is like outside work",
          "What you saw them do, when, and where",
          "Rumors other people have heard",
        ],
        answer: 2,
        why: "Security can verify an action against logs and badge records. Opinions cannot be checked and can harm an innocent colleague.",
      },
    ],
  },
  {
    id: "insider-report",
    moduleId: "insider",
    title: "Report it. Do not investigate it.",
    minutes: 5,
    fieldRule: "Your job ends at a clear report. Theirs starts there.",
    sections: [
      {
        heading: "The path is the same one",
        paragraphs: [
          "Insider concerns go where every other concern goes: write security@harborandco.com from a message you start, or call extension 4400 from a Harbor phone. Your manager is a fine first stop, unless your manager is the concern. Then go straight to security.",
        ],
      },
      {
        heading: "Do not play detective",
        paragraphs: [
          "Do not confront the person, search their desk, open their files, or follow them. Do not ask other people what they think. Each of those can tip someone off, destroy evidence, break policy, and, if you are wrong, hurt someone who did nothing. Write down what you saw while it is fresh, then hand it over.",
        ],
      },
      {
        heading: "Good faith is protected",
        paragraphs: [
          "Harbor does not punish an honest report that turns out to have an innocent explanation. Many do. The engineer copying drawings may have been told to by a customer. Security finds that out quietly, and nobody is accused in the hallway. Retaliating against someone for reporting is itself a policy violation.",
        ],
      },
    ],
    questions: [
      {
        id: "insider-report-q1",
        prompt: "You see a colleague photographing a screen of customer contracts with a personal phone. You should",
        choices: [
          "Ask them to delete the photos and forget it",
          "Look through their phone when they step away",
          "Note what you saw and when, and report it to security",
          "Mention it to the team so everyone watches them",
        ],
        answer: 2,
        why: "A dated, specific report lets security check without accusing anyone. Confronting or searching can destroy evidence and break policy.",
      },
      {
        id: "insider-report-q2",
        prompt: "Your concern is about your own manager. Report to",
        choices: [
          "Your manager, to be fair",
          "Security directly, through security@ or extension 4400",
          "A coworker you trust",
          "Nobody until you have proof",
        ],
        answer: 1,
        why: "Skip any step in the chain that is part of the concern. Proof is security's job, not a precondition for reporting.",
      },
      {
        id: "insider-report-q3",
        prompt: "The report turns out to have an innocent explanation. What happens to you?",
        choices: [
          "You are disciplined for wasting time",
          "Nothing. Good-faith reports are protected",
          "You lose access to the system",
          "You must apologize publicly",
        ],
        answer: 1,
        why: "Programs depend on people reporting early. Honest mistakes are expected and protected; retaliation is not allowed.",
      },
    ],
  },
  {
    id: "insider-you",
    moduleId: "insider",
    title: "You are an insider too",
    minutes: 5,
    fieldRule: "Anyone who offers you something for your access is reporting themselves to you.",
    sections: [
      {
        heading: "Your access is the prize",
        paragraphs: [
          "Your badge, your login, and the files you can open are worth more to an attacker than anything on your desk. Criminal groups openly offer workers cash to run a program, share a login, or plug in a device. The pitch often comes through a personal account, a stranger at a bar, or a recruiter message that turns strange.",
        ],
      },
      {
        heading: "The small asks first",
        paragraphs: [
          "It rarely starts with money. A friendly contact asks which systems you use, who approves payments, what the badge readers look like. Then a small favor. Then something that is hard to undo. Each step feels minor, which is the point. The pause from module 01 applies here too.",
        ],
      },
      {
        heading: "If you are approached",
        paragraphs: [
          "Do not negotiate, play along, or try to gather evidence. Stop, keep the messages, and report to security the same day. If you already did something, an early report is still the best move you have. Waiting turns a mistake into a cover-up.",
        ],
      },
    ],
    questions: [
      {
        id: "insider-you-q1",
        prompt: "A stranger on a social site offers you money to run a file on your work laptop. You should",
        choices: [
          "Ignore it and delete the messages",
          "Play along to find out who they are",
          "Keep the messages and report it to security today",
          "Run it on a personal laptop instead",
        ],
        answer: 2,
        why: "An offer for your access is an attack in progress. Security needs the messages, and deleting them throws away the evidence.",
      },
      {
        id: "insider-you-q2",
        prompt: "A friendly contact keeps asking which payment systems you use and who approves wires. This is",
        choices: [
          "Normal small talk",
          "Possible reconnaissance, which is worth a pause and a report",
          "Only a problem if they ask for a password",
          "A sales lead",
        ],
        answer: 1,
        why: "Attackers map people and approvals before they ask for anything. The questions are the early warning.",
      },
      {
        id: "insider-you-q3",
        prompt: "You already shared a login with someone who turned out to be fake. Now",
        choices: [
          "Change the password and tell no one",
          "Report it to security immediately, and include what you shared",
          "Wait to see if anything bad happens",
          "Ask the person to stop using it",
        ],
        answer: 1,
        why: "Security can cut off the access and check what it touched. Silence gives the attacker time.",
      },
    ],
  },
];
