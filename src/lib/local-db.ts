"use client";

// Simple IndexedDB wrapper for storing video blobs and metadata locally
// This avoids the 5MB LocalStorage limit and allows "offline" MVP testing.

const DB_NAME = "JobFairMVP";
const DB_VERSION = 7; // Increment to force re-seed
const STORES = {
    APPLICATIONS: "applications", // { id, jobId, seekerId, videoBlob, resumeBlob, resumeName, timestamp, visibility, status }
    JOBS: "jobs", // { id, title, company, salary, type, logo, status, created_at, filled_at }
    USERS: "users", // { id, name, role }
    PROFILES: "profiles", // { id, name, title, bio, skills, experience, resumeBlob, introVideoBlob, socialLinks }
    MESSAGES: "messages", // { id, applicationId, senderId, receiverId, content, timestamp }
    REVIEWS: "reviews" // { id, employerId, seekerId, rating, comment, timestamp }
};

const MOCK_JOBS = [
    {
        id: "job-1",
        title: "Senior Product Designer",
        company: "Creative Zen",
        location: "Remote",
        salary: "$130k - $160k",
        type: "Full-time",
        tags: ["Figma", "React", "UX Research"],
        logo: "bg-purple-500",
        status: "open",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        description: "We are looking for a Senior Product Designer to lead our design system and create intuitive user experiences. You will work closely with engineering and product teams to deliver high-quality designs that solve real user problems.",
        requirements: [
            "5+ years of experience in product design",
            "Proficiency in Figma and prototyping tools",
            "Strong understanding of design systems"
        ],
        responsibilities: [
            "Lead the design of new features from concept to launch",
            "Maintain and evolve our design system",
            "Mentor junior designers"
        ]
    },
    {
        id: "job-2",
        title: "Full Stack Engineer",
        company: "TechNova",
        location: "San Francisco, CA",
        salary: "$150k - $200k",
        type: "Hybrid",
        tags: ["Next.js", "TypeScript", "Node.js"],
        logo: "bg-blue-500",
        status: "open",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        description: "Join our core engineering team to build scalable web applications. You will be responsible for the full software development lifecycle, from architecture to deployment.",
        requirements: [
            "Strong command of TypeScript and Next.js",
            "Experience with serverless architectures",
            "Knowledge of SQL and NoSQL databases"
        ],
        responsibilities: [
            "Develop high-performance API endpoints",
            "Build responsive front-end interfaces",
            "Optimize application performance"
        ]
    },
    {
        id: "job-3",
        title: "Growth Marketing Manager",
        company: "EcoLoop",
        location: "Austin, TX",
        salary: "$90k - $120k",
        type: "Full-time",
        tags: ["SEO", "Content", "Analytics"],
        logo: "bg-green-500",
        status: "open",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        description: "We need a data-driven marketer to drive user acquisition and retention. You will experiment with new channels and optimize our conversion funnels.",
        requirements: [
            "3+ years in growth marketing",
            "Experience with Google Analytics and Mixpanel",
            "Strong copywriting skills"
        ],
        responsibilities: [
            "Manage paid ad campaigns",
            "Optimize landing pages for conversion",
            "Analyze user behavior data"
        ]
    },
    {
        id: "job-4",
        title: "AI Research Scientist",
        company: "NeuralNet",
        location: "New York, NY",
        salary: "$200k - $300k",
        type: "On-site",
        tags: ["Python", "PyTorch", "LLMs"],
        logo: "bg-red-500",
        status: "open",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
        description: "Push the boundaries of AI research with our world-class team. You will work on cutting-edge LLMs and computer vision models.",
        requirements: [
            "PhD in Computer Science or related field",
            "Publications in top-tier conferences",
            "Deep understanding of deep learning"
        ],
        responsibilities: [
            "Conduct novel research in AI",
            "Publish papers and present findings",
            "Collaborate with engineering to productize models"
        ]
    },
    {
        id: "job-5",
        title: "Customer Success Lead",
        company: "CloudScale",
        location: "Denver, CO",
        salary: "$80k - $110k",
        type: "Remote",
        tags: ["SaaS", "Support", "CRM"],
        logo: "bg-orange-500",
        status: "open",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        description: "We are looking for a customer-obsessed individual to lead our support team. You will ensure our customers get the most value out of our platform.",
        requirements: [
            "3+ years in customer success or support",
            "Experience with CRM tools like Salesforce",
            "Excellent written and verbal communication"
        ],
        responsibilities: [
            "Onboard new enterprise customers",
            "Resolve technical escalations",
            "Gather customer feedback for product team"
        ]
    },
    {
        id: "job-6",
        title: "Video Editor / Motion Designer",
        company: "Streamline Studios",
        location: "Los Angeles, CA",
        salary: "$70k - $95k",
        type: "Contract",
        tags: ["Premiere", "After Effects", "Storytelling"],
        logo: "bg-pink-500",
        status: "open",
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
        description: "Create compelling video content for our social media channels. We need someone who can tell a story in 15 seconds or less.",
        requirements: [
            "Portfolio of social media content",
            "Proficiency in Adobe Creative Suite",
            "Ability to work under tight deadlines"
        ],
        responsibilities: [
            "Edit daily social clips",
            "Design motion graphics assets",
            "Collaborate with content creators"
        ]
    }
];

const MOCK_PROFILES = [
    {
        id: "profile-1",
        name: "Alex Jobseeker",
        title: "Creative Technologist",
        bio: "I bridge the gap between design and engineering. Passionate about building accessible and delightful user experiences.",
        skills: ["React", "TypeScript", "UI/UX", "WebGL"],
        experience: "5 years",
        resumes: [
            // Mock blobs aren't easily serializable here without real Files, so we'll simulate the structure
            // In a real browser env we'd need meaningful blobs, but for the MVP check in ApplicationContent
            // we just need the metadata to show the dropdown. The actual blob usage would fail if we try to upload
            // a fake text blob to a real server, but for localDB it just stores whatever.
            { id: "res-1", name: "Alex_Design_Resume.pdf", date: "2023-10-01" },
            { id: "res-2", name: "Alex_Engineering_CV.pdf", date: "2023-12-15" },
            { id: "res-3", name: "Alex_General_Resume.docx", date: "2024-01-20" }
        ]
    }
];

class LocalDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject("Error opening DB");

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Force clear for MVP seed update
                if (db.objectStoreNames.contains(STORES.JOBS)) db.deleteObjectStore(STORES.JOBS);
                if (db.objectStoreNames.contains(STORES.PROFILES)) db.deleteObjectStore(STORES.PROFILES);

                // Create Stores
                if (!db.objectStoreNames.contains(STORES.APPLICATIONS)) {
                    db.createObjectStore(STORES.APPLICATIONS, { keyPath: "id" });
                }
                if (!db.objectStoreNames.contains(STORES.USERS)) {
                    db.createObjectStore(STORES.USERS, { keyPath: "id" });
                }

                // Re-seed Jobs
                const jobStore = db.createObjectStore(STORES.JOBS, { keyPath: "id" });
                MOCK_JOBS.forEach(job => jobStore.add(job));

                // Re-seed Profiles
                const profileStore = db.createObjectStore(STORES.PROFILES, { keyPath: "id" });
                MOCK_PROFILES.forEach(p => profileStore.add(p));

                if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
                    const msgStore = db.createObjectStore(STORES.MESSAGES, { keyPath: "id" });
                    msgStore.createIndex("applicationId", "applicationId", { unique: false });
                }

                if (!db.objectStoreNames.contains(STORES.REVIEWS)) {
                    db.createObjectStore(STORES.REVIEWS, { keyPath: "id" });
                }
            };

            request.onsuccess = (event) => {
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            };
        });
    }

    // --- Users (Auth) ---

    async registerUser(user: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise(async (resolve, reject) => {
            // Check if email exists
            const allUsers = await this.getAllUsers();
            if (allUsers.find(u => u.email === user.email)) {
                reject("Email already exists");
                return;
            }

            const transaction = this.db!.transaction([STORES.USERS], "readwrite");
            const store = transaction.objectStore(STORES.USERS);
            const request = store.add(user);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error creating user");
        });
    }

    async loginUser(email: string, password: string): Promise<any> {
        if (!this.db) await this.init();
        return new Promise(async (resolve, reject) => {
            const allUsers = await this.getAllUsers();
            const user = allUsers.find(u => u.email === email && u.password === password);

            if (user) {
                resolve(user);
            } else {
                reject("Invalid email or password");
            }
        });
    }

    async getUser(id: string): Promise<any> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.USERS], "readonly");
            const store = transaction.objectStore(STORES.USERS);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching user");
        });
    }

    private async getAllUsers(): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.USERS], "readonly");
            const store = transaction.objectStore(STORES.USERS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching messages"); // Copy pasta error fix later if needed or just be generic
        });
    }

    // --- Applications ---

    async saveApplication(application: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.APPLICATIONS], "readwrite");
            const store = transaction.objectStore(STORES.APPLICATIONS);
            const request = store.put(application);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error saving application");
        });
    }

    async updateApplicationStatus(id: string, status: 'shortlisted' | 'rejected' | 'new'): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.APPLICATIONS], "readwrite");
            const store = transaction.objectStore(STORES.APPLICATIONS);
            const getReq = store.get(id);

            getReq.onsuccess = () => {
                const data = getReq.result;
                if (data) {
                    data.status = status;
                    store.put(data);
                    resolve();
                } else {
                    reject("Application not found");
                }
            };
            getReq.onerror = () => reject("Error fetching application to update");
        });
    }

    async getApplications(): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.APPLICATIONS], "readonly");
            const store = transaction.objectStore(STORES.APPLICATIONS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching applications");
        });
    }

    // --- Jobs ---

    async getJobs(): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.JOBS], "readonly");
            const store = transaction.objectStore(STORES.JOBS);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching jobs");
        });
    }

    async getJobById(id: string): Promise<any> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.JOBS], "readonly");
            const store = transaction.objectStore(STORES.JOBS);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching job");
        });
    }

    async createJob(job: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.JOBS], "readwrite");
            const store = transaction.objectStore(STORES.JOBS);
            const request = store.add(job);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error creating job");
        });
    }

    // --- Profiles (New) ---

    async saveProfile(profile: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PROFILES], "readwrite");
            const store = transaction.objectStore(STORES.PROFILES);
            const request = store.put(profile);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error saving profile");
        });
    }

    async getProfile(id: string): Promise<any> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PROFILES], "readonly");
            const store = transaction.objectStore(STORES.PROFILES);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching profile");
        });
    }

    async getAllProfiles(): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.PROFILES], "readonly");
            const store = transaction.objectStore(STORES.PROFILES);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching all profiles");
        });
    }

    // --- Messages ---

    async sendMessage(message: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.MESSAGES], "readwrite");
            const store = transaction.objectStore(STORES.MESSAGES);
            const request = store.add(message);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error sending message");
        });
    }

    async getMessages(applicationId: string): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.MESSAGES], "readonly");
            const store = transaction.objectStore(STORES.MESSAGES);
            const index = store.index("applicationId");
            const request = index.getAll(applicationId);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching messages");
        });
    }

    async getAllMessages(): Promise<any[]> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.MESSAGES], "readonly");
            const store = transaction.objectStore(STORES.MESSAGES);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject("Error fetching all messages");
        });
    }
    // --- Reviews & Reputation ---

    async submitReview(review: any): Promise<void> {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([STORES.REVIEWS], "readwrite");
            const store = transaction.objectStore(STORES.REVIEWS);
            const request = store.add(review);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error submitting review");
        });
    }

    async closeJob(jobId: string): Promise<void> {
        if (!this.db) await this.init();
        return new Promise(async (resolve, reject) => {
            const job = await this.getJobById(jobId);
            if (!job) { reject("Job not found"); return; }

            job.status = "filled";
            job.filled_at = new Date().toISOString();

            const transaction = this.db!.transaction([STORES.JOBS], "readwrite");
            const store = transaction.objectStore(STORES.JOBS);
            const request = store.put(job);

            request.onsuccess = () => resolve();
            request.onerror = () => reject("Error closing job");
        });
    }

    async getEmployerStats(companyName: string): Promise<{ avgRating: number, reviewCount: number, avgDaysToHire: number }> {
        if (!this.db) await this.init();

        // Parallel fetch for Reviews and Jobs
        const [allReviews, allJobs] = await Promise.all([
            new Promise<any[]>((resolve) => {
                const tx = this.db!.transaction([STORES.REVIEWS], "readonly");
                tx.objectStore(STORES.REVIEWS).getAll().onsuccess = (e: any) => resolve(e.target.result);
            }),
            new Promise<any[]>((resolve) => {
                const tx = this.db!.transaction([STORES.JOBS], "readonly");
                tx.objectStore(STORES.JOBS).getAll().onsuccess = (e: any) => resolve(e.target.result);
            })
        ]);

        // Filter for this company (using name as ID for MVP simplicity really we should use employerId but mock jobs don't have it)
        // For MVP, we'll assume we pass the company name from the job

        // 1. Calculate Ratings
        // Note: In a real app we'd link reviews to employerId. Here we'll match by a "company" field in the review if we had it, 
        // OR we just assume the review has employerId and we need to map companyName -> employerId.
        // LIMITATION: MOCK_JOBS don't have owner IDs. 
        // WORKAROUND: We will store "companyName" in the review for the MVP to make it easy.
        const companyReviews = allReviews.filter(r => r.companyName === companyName);
        const avgRating = companyReviews.length > 0
            ? companyReviews.reduce((acc, r) => acc + r.rating, 0) / companyReviews.length
            : 0;

        // 2. Calculate Time to Hire
        const filledJobs = allJobs.filter(j => j.company === companyName && j.status === 'filled' && j.created_at && j.filled_at);
        let totalDays = 0;
        filledJobs.forEach(j => {
            const start = new Date(j.created_at).getTime();
            const end = new Date(j.filled_at).getTime();
            const days = (end - start) / (1000 * 60 * 60 * 24);
            totalDays += days;
        });
        const avgDaysToHire = filledJobs.length > 0 ? Math.round(totalDays / filledJobs.length) : 0;

        return {
            avgRating: parseFloat(avgRating.toFixed(1)),
            reviewCount: companyReviews.length,
            avgDaysToHire
        };
    }
}

export const localDB = new LocalDB();
