import {
  AudioWaveform,
  BadgeDollarSign,
  Boxes,
  Command,
  Frame,
  GalleryVerticalEnd,
  Landmark,
  Map,
  PieChart,
  Shield,
  UserRound,
} from "lucide-react";

export const boxArray = (count) => [
  {
    name: "Users",
    status: null,
    link: "/users",
    icon: <UserRound />,
    number: count?.users,
  },
  {
    name: "User Groups",
    status: "Running",
    link: "/user-groups",
    icon: <Boxes />,
    number: count?.user_groups,
  },
  {
    name: "Institutions",
    status: "Offline",
    link: "/institutions",
    icon: <Landmark />,
    number: count?.institutions,
  },
];

// This is sample data.
export const sidebarData = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Sales",
      url: "#",
      icon: BadgeDollarSign,
      isActive: true,
      items: [
        {
          title: "Estimates",
          url: "#",
        },
      ],
    },
    {
      title: "Admin",
      url: "#",
      icon: Shield,
      items: [
        {
          title: "User 1",
          url: "#",
        },
        {
          title: "User 2",
          url: "#",
        },
        {
          title: "User 3",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
};
