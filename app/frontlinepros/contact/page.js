import { Mast, Foot } from '../chrome';
import { productBase } from '../nav';
import ContactForm from './form';
import { brand } from '../brand';

export const metadata = { title: `Talk to us — ${brand.NAME}` };

export default function ContactPage() {
  return (
    <>
      <Mast />
      <ContactForm base={productBase()} />
      <Foot />
    </>
  );
}
