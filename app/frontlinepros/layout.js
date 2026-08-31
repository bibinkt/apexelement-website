import { brand } from './brand';
import './fp.css';

export const metadata = {
  title: `${brand.NAME} — The call you missed just texted you back`,
  description:
    'When your phone rings and everyone is on a job, we answer by text from your own number, find out what is broken, get a photo of the model plate, and send you a job card.',
  keywords:
    'missed call text back, appliance repair, HVAC, plumbing, service business phone, job card',
};

export default function RwLayout({ children }) {
  return <div className="rw">{children}</div>;
}
