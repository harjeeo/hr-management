export type LeadStatus = 'Cold Lead' | 'Warm Lead' | 'Hot Lead'

export interface Lead {
  id: string
  name: string
  subject: string
  activityDate: string
  status: LeadStatus
  createdAgo: string
  source: string
  phone: string
  email: string
}

export const leads: Lead[] = [
  {
    id: '1',
    name: 'Jenny Wilson',
    subject: 'Redesign mobile app',
    activityDate: 'Sep 12 at 09:10 AM',
    status: 'Cold Lead',
    createdAgo: '1 month ago',
    source: 'Dribbble',
    phone: '+91 98765 43210',
    email: 'jenny.wilson@gmail.com',
  },
  {
    id: '2',
    name: 'David Lane',
    subject: 'Full Website Design',
    activityDate: 'Sep 12 at 10:15 AM',
    status: 'Hot Lead',
    createdAgo: '2 months ago',
    source: 'Instagram',
    phone: '+91 98765 43211',
    email: 'david.lane@gmail.com',
  },
  {
    id: '3',
    name: 'Michael Smith',
    subject: 'Dashboard & Admin Panel',
    activityDate: 'Sep 12 at 11:20 AM',
    status: 'Warm Lead',
    createdAgo: '3 months ago',
    source: 'Google',
    phone: '+91 98765 43212',
    email: 'michael.smith@gmail.com',
  },
  {
    id: '4',
    name: 'Chris Lee',
    subject: 'Landing Page Design',
    activityDate: 'Sep 12 at 12:25 PM',
    status: 'Cold Lead',
    createdAgo: '4 months ago',
    source: 'Facebook',
    phone: '+91 98765 43213',
    email: 'chris.lee@gmail.com',
  },
  {
    id: '5',
    name: 'Emily Johnson',
    subject: 'Branding & Identity',
    activityDate: 'Sep 12 at 01:30 PM',
    status: 'Hot Lead',
    createdAgo: '5 months ago',
    source: 'Dribbble',
    phone: '+91 98765 43214',
    email: 'emily.johnson@gmail.com',
  },
  {
    id: '6',
    name: 'Steven Davis',
    subject: 'Marketing Website Design',
    activityDate: 'Sep 12 at 02:35 PM',
    status: 'Warm Lead',
    createdAgo: '6 months ago',
    source: 'Google',
    phone: '+91 98765 43215',
    email: 'steven.davis@gmail.com',
  },
  {
    id: '7',
    name: 'Alex Jaka',
    subject: 'Mobile Game UI',
    activityDate: 'Sep 12 at 03:40 PM',
    status: 'Cold Lead',
    createdAgo: '7 months ago',
    source: 'Dribbble',
    phone: '+91 98765 43216',
    email: 'alex.jaka@gmail.com',
  },
  {
    id: '8',
    name: 'James Brown',
    subject: 'SaaS Product Design',
    activityDate: 'Sep 12 at 04:45 PM',
    status: 'Hot Lead',
    createdAgo: '8 months ago',
    source: 'Facebook',
    phone: '+91 98765 43217',
    email: 'james.brown@gmail.com',
  },
  {
    id: '9',
    name: 'James Kaka',
    subject: 'Portfolio Website',
    activityDate: 'Sep 12 at 05:50 PM',
    status: 'Warm Lead',
    createdAgo: '9 months ago',
    source: 'LinkedIn',
    phone: '+91 98765 43218',
    email: 'james.kaka@gmail.com',
  },
  {
    id: '10',
    name: 'Thomas Hodai',
    subject: 'Onboarding Flow Design',
    activityDate: 'Sep 13 at 09:55 AM',
    status: 'Cold Lead',
    createdAgo: '10 months ago',
    source: 'Instagram',
    phone: '+91 98765 43219',
    email: 'thomas.hodai@gmail.com',
  },
  {
    id: '11',
    name: 'Linda Martinez',
    subject: 'Chat & Messaging App UI',
    activityDate: 'Sep 13 at 11:00 AM',
    status: 'Hot Lead',
    createdAgo: '11 months ago',
    source: 'LinkedIn',
    phone: '+91 98765 43220',
    email: 'linda.martinez@gmail.com',
  },
]
