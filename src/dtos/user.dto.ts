import { User } from '../types';

class UserDTO {
  static toResponse(user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      address: user.address,
      phone_number: user.phone_number,
      date_of_birth: user.date_of_birth,
      city: user.city,
      country_code: user.country_code,
      registration_date: user.registration_date,
      last_login: user.last_login,
      is_locked: user.is_locked
    };
  }
}

export default UserDTO;
