export type Actor = {
  id: string;
  name: string;
  sector: string;
  motive: string;
  pitch: string;
  inclusionScore: number;
  followupScore: number;
  spokenTo: boolean;
  contactName: string;
  contactRole: string;
  booth?: string;
  notes: string;
  nextAction: string;
  buckets: string[];
  publications?: string[];
  eventsAppeared?: string[];
  interestTopics?: string[];
  roleInEcosystem?: string;
  wantsNeeds?: string;
  engagementStrategy?: string;
  leverageForAI4Inclusion?: string;
  summitContext?: string;
  summitSourceTags?: string[];
  profileImage?: string;
  linkedinUrl?: string;
  linkedinHeadline?: string;
  linkedinLocation?: string;
  linkedinConnections?: string;
  linkedinExperience?: Array<{ title: string; company: string; duration: string }>;
  linkedinEducation?: Array<{ school: string; degree: string }>;
  xHandle?: string;
  xProfileUrl?: string;
  recentTweets?: Array<{ url: string; type: string }>;
  dpiTweets?: Array<{ url: string; type: string }>;
  lastEnriched?: string;
};

export type CandidateActor = {
  name: string;
  sector: string;
  summitContext?: string;
  summitSourceTags?: string[];
  notes?: string;
};

