import Head from "next/head";
import Link from "next/link";
import data from "../data/portfolio.json";

export default function Home() {
  return (
    <>
      <Head>
        <title>{data.name}</title>
        <meta
          name="description"
          content="Dimuthu Wickramanayake — Senior Platform Engineer building distributed systems and AI infrastructure."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>

      {/* Top Nav */}
      <nav className="max-w-2xl mx-auto px-6 pt-8 pb-4 flex items-center justify-between">
        <span className="font-semibold text-sm">Dimuthu Wickramanayake</span>
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-gray-500">
          <Link href="/blog">Blog</Link>
          {data.socials
            .filter((s) => s.title !== "Blog")
            .map((social) => (
              <a
                key={social.id}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.title}
              </a>
            ))}
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        {/* Greeting */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">
          Hi, I&apos;m Dimuthu
        </h1>
        <p className="mt-3 text-lg text-gray-500">
          An Engineer. I architect distributed systems &amp; AI infrastructure
          that scale to millions.{" "}
          {data.apps.map((app) => (
            <a
              key={app.id}
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-3 py-0.5 text-sm font-medium no-underline
                bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors
                ml-1 align-middle"
            >
              {app.title}
            </a>
          ))}
        </p>

        {/* Life Story */}
        <section className="mt-10 space-y-5 text-[17px] text-gray-700 leading-[1.8]">
          <p>
            I grew up in Sri Lanka. Thanks to strong A/L results, I earned a
            free education at the{" "}
            <a
              href="https://www.ce.pdn.ac.lk/"
              target="_blank"
              rel="noopener noreferrer"
            >
              University of Peradeniya, Faculty of Engineering
            </a>
            , where I studied Computer Engineering. My final year research project was
            on{" "}
            <a
              href="https://www.researchgate.net/publication/330467111_Landing_a_Quadcopter_on_to_a_moving_landing_target_using_Computer_Vision"
              target="_blank"
              rel="noopener noreferrer"
            >
              landing a quadcopter on a moving target using computer vision
            </a>
            .
          </p>

          <p>
            During my internship at Wavenet, I built an emergency dispatching
            application for a security company. That work earned me the{" "}
            <strong>Best Industrial Trainee</strong> award from the Institution
            of Engineers Sri Lanka (IESL).
          </p>

          <p>
            I joined{" "}
            <a
              href="https://www.directfn.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              DirectFN
            </a>{" "}
            and worked on a stock market brokerage application, building backend
            APIs for financial trading systems.
          </p>

          <p>
            At{" "}
            <a
              href="https://syscolabs.lk/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Sysco LABS
            </a>
            , I led the freight management apps team, developing distributed
            microservices on AWS with real-time streaming pipelines.
          </p>

          <p>
            I then joined{" "}
            <a
              href="https://www.bitsmedia.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Bitsmedia
            </a>{" "}
            and helped them migrate the platform from a cloud function-based
            setup to a GKE Kubernetes cluster. Along the way, I drove cost
            reductions in video pipelines and built a new data platform from the
            ground up.
          </p>

          <p>
            I&apos;m an active public builder — I share what I learn through{" "}
            <a
              href="https://medium.com/@billacode"
              target="_blank"
              rel="noopener noreferrer"
            >
              writing on Medium
            </a>{" "}
            and open-source projects on{" "}
            <a
              href="https://github.com/deBilla"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </p>
        </section>

        {/* Experience */}
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight mb-6">Experience</h2>
          <div className="space-y-5">
            {data.resume.experiences.map((exp) => (
              <div key={exp.id}>
                <p className="font-medium">{exp.position}</p>
                <p className="text-sm text-gray-500 mt-0.5">{exp.dates}</p>
              </div>
            ))}
            <div>
              <p className="font-medium">
                {data.resume.education.universityPara} —{" "}
                {data.resume.education.universityName}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {data.resume.education.universityDate}
              </p>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight mb-6">Projects</h2>
          <div className="space-y-4">
            {data.projects.map((project) => (
              <div key={project.id}>
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium"
                >
                  {project.title}
                </a>
                <p className="text-sm text-gray-500 mt-0.5">
                  {project.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Writing */}
        <section className="mt-16">
          <h2 className="text-xl font-bold tracking-tight mb-4">Writing</h2>
          <p className="text-[17px] text-gray-700 leading-[1.8]">
            I write about distributed systems, AI infrastructure, and cloud
            architecture on{" "}
            <a
              href="https://medium.com/@billacode"
              target="_blank"
              rel="noopener noreferrer"
            >
              Medium
            </a>
            . Archived posts are available <Link href="/blog">here</Link>.
          </p>
        </section>

        {/* Footer */}
        <footer className="mt-20 pt-8 border-t border-gray-200">
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {data.socials.map((social) => (
              <a
                key={social.id}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {social.title}
              </a>
            ))}
          </div>
          <p className="mt-8 text-xs text-gray-400">
            &copy; {new Date().getFullYear()} Dimuthu Wickramanayake
          </p>
        </footer>
      </main>
    </>
  );
}
