import logo from '@/assets/status.svg';

export function Landing() {

  return (
    <div className="flex flex-col items-center mb-16">
      <div className="flex justify-around mt-16">
        <a href="https://github.com/statuscompliance" target="_blank">
          <img src={logo} className="statusImg size-24" alt="STATUS logo" />
        </a>
      </div>
      <div className="card flex flex-col justify-center items-center gap-y-3">
        <div className="rounded-lg p-4 mb-8">
          <p className="text-primary max-w-screen-lg mx-auto text-center text-pretty">
            <strong className="text-lg">STATUS</strong> is a cutting-edge, cloud-native platform designed to revolutionize clinic management. Our microservices-based architecture enables healthcare providers to efficiently handle patient appointments, manage multiple medical specialties, and maintain detailed patient histories. With real-time scheduling, secure access to clinical data, and seamless communication between doctors, patients, and clinic staff, STATUS empowers healthcare professionals to deliver superior patient care.
          </p>
        </div>
      </div>
    </div>
  );
}
