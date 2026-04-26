const creators = [
  {
    name: "Irmin Hernandez Jimenez",
    role: "Co-Founder & Lead Developer",
    bio: "I am eager to apply my technical knowledge and problem-solving skills in a challenging and innovative environment.",
    avatar: "/assets/creators/irmin.png",
    socials: {
      github: "https://github.com/IrminDev/",
      linkedin: "https://www.linkedin.com/in/irmindev/",
      twitter: "#",
    },
  },
  {
    name: "Johann Daniel Trejo Flores",
    role: "Co-Founder & Backend Engineer",
    bio: "Dedicated to creating robust and scalable systems that power the next generation of coding education.",
    avatar: "",
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
  {
    name: "Rodolfo Aparicio Lopez",
    role: "Co-Founder & UI/UX Designer",
    bio: "Focused on crafting intuitive and beautiful experiences that inspire students and teachers alike.",
    avatar: "",
    socials: {
      github: "#",
      linkedin: "#",
      twitter: "#",
    },
  },
];

export function Creators() {
  return (
    <section id="creators" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-dark-surface" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-azure/20 dark:via-yellow/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-azure/20 dark:via-yellow/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-6">
            <span className="text-sm font-medium text-azure dark:text-yellow">
              Meet the Team
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            The <span className="gradient-text">Creators</span> Behind{" "}
            <span className="gradient-text-gold">CodeHive</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            We're a passionate team of developers and educators dedicated to
            transforming how programming is taught and learned.
          </p>
        </div>

        {/* Creators Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {creators.map((creator, index) => (
            <div
              key={creator.name}
              className="group relative bg-white dark:bg-dark-card rounded-3xl p-8 
                       border border-gray-200 dark:border-gray-700/50 
                       hover:border-azure/50 dark:hover:border-yellow/50
                       transition-all duration-500 hover:shadow-2xl hover:shadow-azure/10 dark:hover:shadow-yellow/10
                       hover:-translate-y-2"
            >
              {/* Decorative gradient */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 rounded-t-3xl bg-gradient-to-r ${
                  index === 0
                    ? "from-azure to-french"
                    : index === 1
                      ? "from-yellow to-gold"
                      : "from-french to-imperial"
                }`}
              />

              {/* Avatar */}
              <div className="flex justify-center mb-6">
                <div
                  className={`w-28 h-28 rounded-full flex items-center justify-center text-5xl
                              bg-gradient-to-br ${
                                index === 0
                                  ? "from-azure/20 to-french/20 dark:from-azure/30 dark:to-french/30"
                                  : index === 1
                                    ? "from-yellow/20 to-gold/20 dark:from-yellow/30 dark:to-gold/30"
                                    : "from-french/20 to-imperial/20 dark:from-french/30 dark:to-imperial/30"
                              }
                              border-4 border-white dark:border-dark-surface shadow-lg
                              group-hover:scale-110 transition-transform duration-300`}
                >
                  <img
                    src={creator.avatar}
                    alt={`${creator.name} avatar`}
                    className="w-24 h-24 rounded-full object-cover"
                  />
                </div>
              </div>

              {/* Content */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {creator.name}
                </h3>
                <p
                  className={`text-sm font-medium mb-4 ${
                    index === 0
                      ? "text-azure dark:text-azure-light"
                      : index === 1
                        ? "text-yellow dark:text-gold"
                        : "text-french dark:text-french-light"
                  }`}
                >
                  {creator.role}
                </p>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-6">
                  {creator.bio}
                </p>

                {/* Social links */}
                <div className="flex justify-center gap-4">
                  <a
                    href={creator.socials.github}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center 
                             text-gray-600 dark:text-gray-400 hover:bg-azure hover:text-white 
                             dark:hover:bg-yellow dark:hover:text-imperial transition-all duration-300"
                    aria-label="GitHub"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </a>
                  <a
                    href={creator.socials.linkedin}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center 
                             text-gray-600 dark:text-gray-400 hover:bg-azure hover:text-white 
                             dark:hover:bg-yellow dark:hover:text-imperial transition-all duration-300"
                    aria-label="LinkedIn"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                    </svg>
                  </a>
                  <a
                    href={creator.socials.twitter}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-dark-surface flex items-center justify-center 
                             text-gray-600 dark:text-gray-400 hover:bg-azure hover:text-white 
                             dark:hover:bg-yellow dark:hover:text-imperial transition-all duration-300"
                    aria-label="Twitter"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Team quote */}
        <div className="mt-16 lg:mt-24 text-center">
          <blockquote className="text-xl lg:text-2xl text-gray-700 dark:text-gray-300 italic max-w-3xl mx-auto">
            "We believe that learning to code should be engaging, accessible,
            and fun. That's why we built CodeHive."
          </blockquote>
          <p className="mt-4 text-azure dark:text-yellow font-medium">
            — The CodeHive Team
          </p>
        </div>
      </div>
    </section>
  );
}
