/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alert';

export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`http://127.0.0.1:4000/api/v1/booking/checkout-session/${tourId}`);
    console.log(session);

    // 2) Redirect to checkout page
    window.location.replace(session.data.session.url);
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
