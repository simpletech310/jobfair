
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mfadwjcxctnzvjltuxbr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_LNpCtaGZKy-cqLILWYmuig_3JN779CT';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const employers = [
    {
        email: 'hr@technova.io',
        password: 'password123',
        company_name: 'TechNova',
        mission: 'Innovating the future of AI and Robotics.',
        culture: 'Fast-paced, remote-first, and obsessed with learning.',
        website: 'https://technova.io',
        jobs: [
            { title: 'Senior Frontend Engineer', location: 'Remote', salary: '$140k - $180k', type: 'Full-time' },
            { title: 'AI Research Scientist', location: 'San Francisco, CA', salary: '$200k - $300k', type: 'Full-time' },
            { title: 'Product Manager', location: 'Remote', salary: '$130k - $160k', type: 'Full-time' },
            { title: 'DevOps Specialist', location: 'New York, NY', salary: '$150k - $190k', type: 'Contract' },
            { title: 'UX Designer', location: 'Remote', salary: '$110k - $140k', type: 'Full-time' },
            { title: 'Data Analyst', location: 'Austin, TX', salary: '$90k - $120k', type: 'Full-time' },
            { title: 'Marketing Lead', location: 'Remote', salary: '$100k - $130k', type: 'Full-time' },
            { title: 'Sales Representative', location: 'Chicago, IL', salary: '$60k + Commission', type: 'Full-time' },
            { title: 'Machine Learning Intern', location: 'Remote', salary: '$40/hr', type: 'Internship' },
            { title: 'Customer Success Manager', location: 'Remote', salary: '$80k - $110k', type: 'Full-time' }
        ]
    },
    {
        email: 'careers@greenearth.org',
        password: 'password123',
        company_name: 'GreenEarth Solutions',
        mission: 'Saving the planet one project at a time.',
        culture: 'Mission-driven, collaborative, and eco-conscious.',
        website: 'https://greenearth.org',
        jobs: [
            { title: 'Environmental Scientist', location: 'Seattle, WA', salary: '$90k - $110k', type: 'Full-time' },
            { title: 'Sustainability Consultant', location: 'Remote', salary: '$80k - $100k', type: 'Contract' },
            { title: 'Full Stack Developer', location: 'Remote', salary: '$120k - $150k', type: 'Full-time' },
            { title: 'Project Manager', location: 'Denver, CO', salary: '$100k - $130k', type: 'Full-time' },
            { title: 'Grant Writer', location: 'Remote', salary: '$60k - $80k', type: 'Part-time' },
            { title: 'Community Outreach Coordinator', location: 'Portland, OR', salary: '$55k - $70k', type: 'Full-time' },
            { title: 'Solar Energy Engineer', location: 'Phoenix, AZ', salary: '$110k - $140k', type: 'Full-time' },
            { title: 'Marketing Intern', location: 'Remote', salary: '$25/hr', type: 'Internship' },
            { title: 'HR Generalist', location: 'Seattle, WA', salary: '$70k - $90k', type: 'Full-time' },
            { title: 'Data Engineer', location: 'Remote', salary: '$130k - $160k', type: 'Full-time' }
        ]
    },
    {
        email: 'jobs@healthplus.med',
        password: 'password123',
        company_name: 'HealthPlus',
        mission: 'Making healthcare accessible for everyone.',
        culture: 'Empathetic, structured, and patient-focused.',
        website: 'https://healthplus.med',
        jobs: [
            { title: 'Telehealth Nurse', location: 'Remote', salary: '$85k - $105k', type: 'Full-time' },
            { title: 'Software Engineer (HealthTech)', location: 'Boston, MA', salary: '$140k - $170k', type: 'Full-time' },
            { title: 'Product Designer', location: 'Remote', salary: '$110k - $135k', type: 'Full-time' },
            { title: 'Medical Biller', location: 'Remote', salary: '$50k - $65k', type: 'Full-time' },
            { title: 'Clinical Reach Coordinator', location: 'Atlanta, GA', salary: '$60k - $80k', type: 'Full-time' },
            { title: 'Systems Administrator', location: 'Boston, MA', salary: '$100k - $125k', type: 'Full-time' },
            { title: 'Mobile App Developer', location: 'Remote', salary: '$130k - $160k', type: 'Contract' },
            { title: 'Health Data Analyst', location: 'Remote', salary: '$95k - $120k', type: 'Full-time' },
            { title: 'Compliance Officer', location: 'Washington, DC', salary: '$110k - $140k', type: 'Full-time' },
            { title: 'Recruiter', location: 'Remote', salary: '$70k - $90k', type: 'Full-time' }
        ]
    }
];

async function seed() {
    console.log('🌱 Starting database seed...');

    for (const employer of employers) {
        console.log(`Processing ${employer.company_name}...`);

        // 1. Sign Up (Create Auth User)
        // eslint-disable-next-line
        let user: any = null;

        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: employer.email,
            password: employer.password,
            options: {
                data: {
                    role: 'employer',
                    company_name: employer.company_name
                }
            }
        });

        if (authError) {
            console.error(`Error creating user ${employer.email}: ${authError.message}`);
            // Try to login if user already exists
            if (authError.message.includes("already registered")) {
                console.log("User exists, trying to sign in...");
                const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
                    email: employer.email,
                    password: employer.password
                });
                if (loginError || !loginData.user) {
                    console.error("Could not sign in existing user, skipping.");
                    continue;
                }
                user = loginData.user;
            } else {
                continue;
            }
        } else {
            user = authData.user;
        }

        if (!user) {
            console.error("No user returned.");
            continue;
        }

        const userId = user.id;
        console.log(`User created/found: ${userId}`);

        // 2. Upsert Employer Profile
        // Note: The trigger might have created it, but we want to ensure full details.
        const { error: profileError } = await supabase
            .from('employers')
            .upsert({
                id: userId,
                email: employer.email,
                company_name: employer.company_name,
                mission: employer.mission,
                culture_description: employer.culture,
                website: employer.website
                // company_logo_url: ... (skipped for now or use placeholder)
            });

        if (profileError) {
            console.error(`Error upserting profile for ${employer.company_name}: ${profileError.message}`);
        }

        const jobsWithEmployer = employer.jobs.map(({ salary, type, ...job }) => ({
            ...job,
            employer_id: userId,
            salary_range: salary,
            job_type: type,
            description: `We are looking for a ${job.title} to join our team at ${employer.company_name}. \n\nResponsibilities:\n- Drive innovation in ${job.title} roles.\n- Collaborate with cross-functional teams.\n- ${employer.mission}\n\nRequirements:\n- 3+ years of experience.\n- Values: ${employer.culture}`,
            requirements: ["Experience in relevant field", "Strong communication skills", "Team player"],
            is_active: true
        }));

        const { error: jobsError } = await supabase
            .from('jobs')
            .insert(jobsWithEmployer);

        if (jobsError) {
            console.error(`Error inserting jobs for ${employer.company_name}: ${jobsError.message}`);
        } else {
            console.log(`✅ Added 10 jobs for ${employer.company_name}`);
        }
    }

    console.log('✨ Seeding complete!');
}

seed();
