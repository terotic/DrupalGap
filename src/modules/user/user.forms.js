/**
 * The user login form.
 * @param {Object} form
 * @param {Object} form_state
 * @return {Object}
 */
function user_login_form(form, form_state) {
  try {
    form.entity_type = 'user';
    form.bundle = null;
    form.elements.name = {
      type: 'textfield',
      title: 'Username',
      title_placeholder: true,
      required: true
    };
    form.elements.pass = {
      type: 'password',
      title: 'Password',
      title_placeholder: true,
      required: true,
      attributes: {
        onkeypress: "drupalgap_form_onkeypress('" + form.id + "')"
      }
    };
    form.elements.submit = {
      type: 'submit',
      value: 'Login'
    };
    if (user_register_access()) {
      form.buttons['create_new_account'] = {
        title: 'Create new account',
        attributes: {
          onclick: "drupalgap_goto('user/register')"
        }
      };
    }
    form.buttons['forgot_password'] = {
      title: 'Request new password',
        attributes: {
          onclick: "drupalgap_goto('user/password')"
        }
    };
    return form;
  }
  catch (error) { console.log('user_login_form - ' + error); }
}

/**
 * The user login form submit handler.
 * @param {Object} form
 * @param {Object} form_state
 */
function user_login_form_submit(form, form_state) {
  try {
    user_login(form_state.values.name, form_state.values.pass, {
      success: function(result) {
        drupalgap_goto(drupalgap.settings.front);
      }
    });
  }
  catch (error) { console.log('user_login_form_submit - ' + error); }
}

/**
 * The user registration form.
 * @param {Object} form
 * @param {Object} form_state
 * @return {Object}
 */
function user_register_form(form, form_state) {
  try {
    form.entity_type = 'user';
    form.bundle = null;
    form.elements.name = {
      type: 'textfield',
      title: 'Käyttäjätunnus',
      title_placeholder: true,
      required: true,
      description: 'Välilyönnit sallittuja. Välimerkit eivät ' +
        'paitsi piste, viiva, kaksoispiste ja alaviiva.'
    };
    form.elements.mail = {
      type: 'email',
      title: 'Sähköpostiosoite',
      title_placeholder: true,
      required: true
    };
    // If e-mail verification is not requred, provide password fields and
    // the confirm e-mail address field.
    if (!drupalgap.site_settings.user_email_verification) {
      form.elements.conf_mail = {
        type: 'email',
        title: 'Sähköpostiosoite uudelleen',
        title_placeholder: true,
        required: true
      };
      form.elements.pass = {
        type: 'password',
        title: 'Salasana',
        title_placeholder: true,
        required: true
      };
      form.elements.pass2 = {
        type: 'password',
        title: 'Salasana uudelleen',
        title_placeholder: true,
        required: true
      };
    }
    // @todo - instead of a null bundle, it appears drupal uses the bundle
    // 'user' instead.
    drupalgap_field_info_instances_add_to_form('user', null, form, null);
    // Add registration messages to form.
    form.user_register = {
      'user_mail_register_no_approval_required_body': 'Rekisteröinti suoritettu!',
      'user_mail_register_pending_approval_required_body':
        'Registration complete, waiting for administrator approval.',
      'user_mail_register_email_verification_body':
        'Registration complete, check your e-mail inbox to verify the account.'
    };
    // Set the auto login boolean. This only happens when the site's account
    // settings require no e-mail verification. Others can stop this from
    // happening via hook_form_alter().
    form.auto_user_login = true;
    // Add submit button.
    form.elements.submit = {
      'type': 'submit',
      'value': 'Rekisteröidy käyttäjäksi'
    };
    return form;
  }
  catch (error) { console.log('user_register_form - ' + error); }
}

/**
 * Define the form's validation function (optional).
 * @param {Object} form
 * @param {Object} form_state
 */
function user_register_form_validate(form, form_state) {
  try {
    // If e-mail verification is not required, make sure the passwords match.
    if (!drupalgap.site_settings.user_email_verification &&
      form_state.values.pass != form_state.values.pass2) {
      drupalgap_form_set_error('pass', 'Salasanat eivät täsmää!');
    }
    // If there are two e-mail address fields on the form, make sure they match.
    if (!empty(form_state.values.mail) && !empty(form_state.values.conf_mail) &&
      form_state.values.mail != form_state.values.conf_mail
    ) { drupalgap_form_set_error('mail', 'Sähköpostiosoitteet eivät täsmää!'); }
  }
  catch (error) {
    console.log('user_register_form_validate - ' + error);
  }
}

/**
 * The user registration form submit handler.
 * @param {Object} form
 * @param {Object} form_state
 */
function user_register_form_submit(form, form_state) {
  try {
    var account = drupalgap_entity_build_from_form_state(form, form_state);
    user_register(account, {
      success: function(data) {
        // Check if e-mail verification is required or not..
        if (!drupalgap.site_settings.user_email_verification) {
          // E-mail verification not needed, if administrator approval is
          // needed, notify the user, otherwise log them in.
          if (drupalgap.site_settings.user_register == '2') {
            drupalgap_alert(
            form.user_register.user_mail_register_pending_approval_required_body
            );
            drupalgap_goto('');
          }
          else {
            drupalgap_alert(
              form.user_register.user_mail_register_no_approval_required_body
            );
            // If we're automatically logging in do it, otherwise just go to
            // the front page.
            if (form.auto_user_login) {
              user_login(account.name, account.pass, {
                  success: function(result) {
                    drupalgap_goto('');
                  }
              });
            }
            else { drupalgap_goto(''); }
          }
        }
        else {
          // E-mail verification needed... notify the user.
          drupalgap_alert(
            form.user_register.user_mail_register_email_verification_body
          );
          drupalgap_goto('');
        }
      },
      error: function(xhr, status, message) {
        // If there were any form errors, display them.
        var msg = _drupalgap_form_submit_response_errors(form, form_state, xhr,
          status, message);
        if (msg) { drupalgap_alert(msg); }
      }
    });
  }
  catch (error) { console.log('user_register_form_submit - ' + error); }
}

/**
 * The user profile form.
 * @param {Object} form
 * @param {Object} form_state
 * @param {Object} account
 * @return {Object}
 */
function user_profile_form(form, form_state, account) {
  try {
    // Setup form defaults.
    form.entity_type = 'user';
    form.bundle = null;

    // Add the entity's core fields to the form.
    drupalgap_entity_add_core_fields_to_form('user', null, form, account);

    // Add the fields for accounts to the form.
    drupalgap_field_info_instances_add_to_form('user', null, form, account);

    // Add password fields to the form. We show the current password field only
    // if the user is editing their account. We show the password and confirm
    // password field no matter what.
    if (Drupal.user.uid == account.uid) {
      form.elements.current_pass = {
        'title': 'Current password',
        'type': 'password',
        'description': 'Enter your current password to change the E-mail ' +
          'address or Password.'
      };
    }
    form.elements.pass_pass1 = {
      'title': 'Password',
      'type': 'password'
    };
    form.elements.pass_pass2 = {
      'title': 'Confirm password',
      'type': 'password',
      'description': 'To change the current user password, enter the new ' +
        'password in both fields.'
    };

    // Add submit to form.
    form.elements.submit = {
      'type': 'submit',
      'value': 'Save'
    };

    // Add cancel button to form.
    form.buttons['cancel'] = {
      'title': 'Cancel',
      attributes: {
        onclick: 'javascript:drupalgap_back();'
      }
    };

    return form;
  }
  catch (error) { console.log('user_profile_form - ' + error); }
}

/**
 * The user profile form submit handler.
 * @param {Object} form
 * @param {Object} form_state
 */
function user_profile_form_submit(form, form_state) {
  try {
    var account = drupalgap_entity_build_from_form_state(form, form_state);
    drupalgap_entity_form_submit(form, form_state, account);
  }
  catch (error) { console.log('user_profile_form_submit - ' + error); }
}

/**
 * The request new password form.
 * @param {Object} form
 * @param {Object} form_state
 */
function user_pass_form(form, form_state) {
  try {
    form.elements['name'] = {
      type: 'textfield',
      title: 'Username or e-mail address',
      required: true,
      attributes: {
        onkeypress: "drupalgap_form_onkeypress('" + form.id + "')"
      }
    };
    form.elements['submit'] = {
      type: 'submit',
      value: 'E-mail new password'
    };
    return form;
  }
  catch (error) { console.log('user_pass_form - ' + error); }
}

/**
 * The request new password form submission handler.
 * @param {Object} form
 * @param {Object} form_state
 */
function user_pass_form_submit(form, form_state) {
  try {
    user_request_new_password(form_state.values['name'], {
        success: function(result) {
          if (result[0]) {
            var msg =
              'Further instructions have been sent to your e-mail address.';
            drupalgap_set_message(msg);
          }
          else {
            var msg = 'There was a problem sending an e-mail to your address.';
            drupalgap_set_message(msg, 'warning');
          }
          drupalgap_goto('user/login');
        }
    });
  }
  catch (error) { console.log('user_pass_form_submit - ' + error); }
}

