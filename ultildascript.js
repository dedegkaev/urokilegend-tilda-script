
window.onload = () => {
  window.mySuccessFunction = function($form) {
    let form;
    if ($form instanceof jQuery) {
      form = $form.get(0);
    } else {
      return;
    }

    const endpoint = 'https://urokilegend.ru/api/mailing/calendar';


    const pushYMEvent = (goal, goalParams = {}) => {
      if (window.ym) {
        window.ym(55273303, 'reachGoal', goal, goalParams);
      }
      if (window.ga) {
        ga('send', {
          'hitType': 'event',
          'eventCategory': 'tilda',
          'eventAction': goal,
        });
      }
    };

    const pushFBEvent = (event, params = {}, meta = {}) => {
      if (window.fbq) {
        window.fbq('track', event, params, meta);
      }
    };


    var obj = {};
    var inputs = form.elements;
    Array.prototype.forEach.call(inputs, function(input) {
      if (input.type === 'radio') {
        if (input.checked) obj[input.name] = input.value;
      } else {
        obj[input.name] = input.value;
      }
    });

    const params = new URLSearchParams(window.location.search);

    const queryObj = Array.from(params).reduce((result, [key, value]) => ({
      ...result,
      [key]: value,
    }), {});

    let UTMData = {};

    const {
      utm_source: source,
      utm_medium: medium,
      utm_content: content,
      utm_campaign: campaign,
      utm_term: term,
      affam,
      client_id,
    } = queryObj;

    if (source || medium || content || campaign || term || affam) {
      UTMData = {
        source,
        medium,
        content: affam || content,
        campaign,
        term,
      };
    }

    console.log('obj', obj);

    const {
      name,
      email,
      phone,
      amount,
      publicId,
      description,
      formname,
      mailtemplate,
      aclistId,
    } = obj;

    if (['buy', 'buy6', 'gift'].includes(formname)) {
      pushFBEvent('InitiateCheckout');
    }

    const popupText = document.querySelectorAll('.t-form__successbox');

    let popupOriginalText = '';

    if (popupText.length && ['buy', 'buy6', 'gift'].includes(formname)) {
      popupText.forEach((item) => {
        popupOriginalText = item.innerHTML;
        item.innerHTML = 'Идет подготовка к оплате...'
      });
    }


    if (['buy', 'buy6', 'gift'].includes(formname)) {
      window.axios.post(endpoint, {
        name,
        email,
        phone,
        UTMData,
        description,
        amount,
        formname,
        mailtemplate,
        aclistId,
        type: 'pass',
      }).then((res) => {
        $('.t-popup_show .t-popup__block-close-button').click();

        const { leadId } = res.data.data;
        const widget = new window.cp.CloudPayments();

        widget.pay('charge', {
          publicId,
          description,
          amount: Number(amount),
          currency: 'RUB',
          invoiceId: leadId,
          skin: 'mini',
          email,
          requireEmail: true,
          data: {
            orderId: leadId,
          },
        }, {
          onComplete({ success }) {
            if (success === true) {
              window.axios.post(endpoint, {
                isUpdate: true,
                updatedLeadId: leadId,
                email,
                clientId: client_id,
                type: 'pass',
                formname,
                mailtemplate,
                aclistId,
              }).then(() => {
                window.open('https://platform.urokilegend.ru/thanks-page-sitnikov', '_self');
              });
              pushYMEvent('purchase_p');
            }
            if (popupText && popupOriginalText) {
              popupText.innerHTML = popupOriginalText;
            }
          }
        });

      });
    }


    if (['call'].includes(formname)) {
      window.axios.post(endpoint, {
        name,
        email,
        phone,
        UTMData,
        description,
        formname,
        mailtemplate,
        aclistId,
        type: 'call',
      }).then((res) => {
        pushYMEvent('sign_up_t');
        setTimeout(() => {
          window.open('https://platform.urokilegend.ru/thanks-page-sitnikov', '_self');
        }, 1000);
      });
    }
  }

  setTimeout(() => {
    document.querySelectorAll('.js-form-proccess').forEach((form) => {
      form.setAttribute('data-success-callback', 'window.mySuccessFunction');
    });
  }, 1000);
};
