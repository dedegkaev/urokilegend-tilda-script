(function(w) {
  const endpoint = 'https://urokilegend.ru/api/mailing/calendar';

  w.App = new function () {
    const app = this;

    this.pushEvent = (goal, goalParams = {}) => {
      if (w.ym) {
        w.ym(55273303, 'reachGoal', goal, goalParams);
      }
      if (w.ga) {
        w.ga('send', {
          'hitType': 'event',
          'eventCategory': 'tilda',
          'eventAction': goal,
        });
      }
    };

    this.pushFBEvent = (event, params = {}, meta = {}) => {
      if (w.fbq) {
        w.fbq('track', event, params, meta);
      }
    };

    this.mySuccessFunction = function (redirectUrl, $form) {
      let form;
      if ($form instanceof jQuery) {
        form = $form.get(0);
      } else {
        return;
      }

      const obj = {};
      const inputs = form.elements;

      Array.prototype.forEach.call(inputs, function (input) {
        if (input.type === 'radio') {
          if (input.checked) obj[input.name] = input.value;
        } else {
          obj[input.name] = input.value;
        }
      });

      const params = new URLSearchParams(w.location.search);

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
        w.axios.post(endpoint, {
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

          app.pushEvent('sign_up_t');

          const { leadId } = res.data.data;
          const widget = new w.cp.CloudPayments();

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
                w.axios.post(endpoint, {
                  isUpdate: true,
                  updatedLeadId: leadId,
                  email,
                  clientId: client_id,
                  type: 'pass',
                  formname,
                  mailtemplate,
                  aclistId,
                }).then(() => {
                  w.open(redirectUrl, '_self');
                });

                app.pushEvent('purchase_p');
              }
              if (popupText && popupOriginalText) {
                popupText.innerHTML = popupOriginalText;
              }
            }
          });

        });
      }


      if (['call'].includes(formname)) {
        w.axios.post(endpoint, {
          name,
          email,
          phone,
          UTMData,
          description,
          formname,
          mailtemplate,
          aclistId,
          type: 'call',
        }).then(() => {
          app.pushEvent('sign_up_t');

          setTimeout(() => {
            w.open(redirectUrl, '_self');
          }, 1000);

        });
      }
    }

    this.init = function (successRedirectUrl) {
      w.$(function () {
        w.mySuccessFunction = app.mySuccessFunction.bind(this, successRedirectUrl);

        w.$('.js-form-proccess').each(function () {
          w.$(this).attr('data-success-callback', 'window.mySuccessFunction');
        });
      });
    }
  };
})(window)


window.App.init();

