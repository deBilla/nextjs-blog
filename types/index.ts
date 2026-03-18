export interface Social {
  id: string;
  title: string;
  link: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  imageSrc: string;
  url: string;
}

export interface Service {
  id: string;
  title: string;
  description: string;
}

export interface Experience {
  id: string;
  dates: string;
  type: string;
  position: string;
  bullets: string;
}

export interface Education {
  universityName: string;
  universityDate: string;
  universityPara: string;
}

export interface Resume {
  tagline: string;
  description: string;
  experiences: Experience[];
  education: Education;
  languages: string[];
  frameworks: string[];
  others: string[];
}

export interface PortfolioData {
  name: string;
  headerTaglineOne: string;
  headerTaglineTwo: string;
  headerTaglineThree: string;
  headerTaglineFour: string;
  showCursor: boolean;
  showBlog: boolean;
  darkMode: boolean;
  showResume: boolean;
  socials: Social[];
  projects: Project[];
  services: Service[];
  aboutpara: string;
  resume: Resume;
}

export interface BlogPost {
  slug: string;
  title: string;
  date: string;
  tagline: string;
  preview: string;
  image: string;
  content: string;
  author?: string;
}

export type BlogPostField = keyof BlogPost;
