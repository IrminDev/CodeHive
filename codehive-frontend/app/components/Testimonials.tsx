const testimonials = [
  {
    quote: "CodeHive transformed how I teach programming. The auto-grading saves me 10+ hours every week, and my students love the instant feedback.",
    author: "Dr. Sarah Chen",
    role: "Computer Science Professor",
    institution: "Stanford University",
    avatar: "SC",
    rating: 5,
  },
  {
    quote: "As a student, I finally feel like I'm learning programming properly. The challenges are fun and I can practice at my own pace.",
    author: "Marcus Johnson",
    role: "CS Student",
    institution: "MIT",
    avatar: "MJ",
    rating: 5,
  },
  {
    quote: "We switched from traditional assignments to CodeHive and saw a 40% improvement in student engagement and completion rates.",
    author: "Prof. David Martinez",
    role: "Department Head",
    institution: "UC Berkeley",
    avatar: "DM",
    rating: 5,
  },
  {
    quote: "The analytics dashboard gives me insights I never had before. I can identify struggling students early and provide targeted help.",
    author: "Emma Williams",
    role: "High School Teacher",
    institution: "Tech Academy",
    avatar: "EW",
    rating: 5,
  },
  {
    quote: "CodeHive's support for multiple languages means I can teach different courses without switching platforms. It's incredibly versatile.",
    author: "James Liu",
    role: "Bootcamp Instructor",
    institution: "CodeCamp Pro",
    avatar: "JL",
    rating: 5,
  },
  {
    quote: "The collaborative features are amazing. My students can learn from each other while I maintain oversight of their progress.",
    author: "Dr. Anna Kowalski",
    role: "Associate Professor",
    institution: "Carnegie Mellon",
    avatar: "AK",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gray-50 dark:bg-dark-surface" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-azure/20 dark:via-yellow/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-azure/20 dark:via-yellow/20 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 lg:mb-24">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-azure/10 dark:bg-yellow/10 border border-azure/20 dark:border-yellow/20 mb-6">
            <span className="text-sm font-medium text-azure dark:text-yellow">
              Trusted by Educators
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Loved by <span className="gradient-text">teachers</span> and{" "}
            <span className="gradient-text-gold">students</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Join thousands of educators who have transformed their programming courses with CodeHive.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.author}
              className="group bg-white dark:bg-dark-card rounded-2xl p-6 lg:p-8 
                       border border-gray-200 dark:border-gray-700/50 
                       hover:border-azure/50 dark:hover:border-yellow/50
                       transition-all duration-300 hover:shadow-xl hover:shadow-azure/5 dark:hover:shadow-yellow/5
                       hover:-translate-y-1"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <svg
                    key={i}
                    className="w-5 h-5 text-yellow"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              {/* Quote */}
              <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white
                              bg-gradient-to-br ${index % 2 === 0 ? "from-azure to-french" : "from-yellow to-gold text-imperial"}`}>
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testimonial.role}
                  </div>
                  <div className="text-xs text-azure dark:text-yellow">
                    {testimonial.institution}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
