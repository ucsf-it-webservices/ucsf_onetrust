(function($, Drupal, once) {
    Drupal.behaviors.videoNoCookies = {
      attach: function (context) {

          // wait for the OnetrustActiveGroups object to be available.
          function waitForObject() {
            return new Promise((resolve, reject) => {
                const intervalId = setInterval(() => {
                    if (window.OnetrustActiveGroups) {
                        clearInterval(intervalId);
                        resolve(window.OnetrustActiveGroups);
                    }
                }, 250);
            });
          }

          waitForObject().then((activeGroup) => {
              // get the iframes just once for to perform rewriting rules.
              const oneTrustIframesOnce  = once('oneTrust_iframes', document.querySelectorAll('iframe'), context);
              oneTrustIframesOnce.forEach( theframe => {
              if (!activeGroup.includes('C0004') || !activeGroup.includes('C0007')) {
                let modifiedSrc = '';
                // console.log('OneTrust values are: ' + activeGroup);
                // console.log('At least one of the following OneTrust groups are blocked, C0004 - Advertising and Targeting, C0007 - Analytics')
                if (theframe.hasAttribute('src')) {
                  modifiedSrc = theframe.src;
                } else {
                  theframe.setAttribute('src', '');
                }
                if (theframe.hasAttribute('data-src')) {
                  let dataSrc = theframe.getAttribute('data-src');
                  if (dataSrc.length > 0) {
                    //console.log('iframe has data-src attribute');
                    modifiedSrc = dataSrc;
                  }
                }
                // console.log('Video source: ' + modifiedSrc);
                // Check if the URL contains 'youtube.com'
                if (modifiedSrc.includes('youtube.com')) {
                // Modify source for YouTube videos using non-cookie domain
                modifiedSrc = modifiedSrc.replace('youtube.com', 'youtube-nocookie.com');
                } else if (modifiedSrc.includes('vimeo.com')) {
                // Modify source for Vimeo videos by appending '&dnt=1'
                modifiedSrc += modifiedSrc.includes('?') ? '&dnt=1' : '?dnt=1';

                }
                theframe.src = modifiedSrc;
                // output the results here so we know the src changed.
                // console.log(theframe.src);
            }
          });
        });
      }
    }

    Drupal.behaviors.oneTrust = {
    attach: function(context) {
      const delayInMilliseconds = 1000; //1 second

      setTimeout(function() {
        // Hack to satisfy client requirements for this ticket:
        // https://ucsfredesign.atlassian.net/browse/UCSFD8-1372
        const oneTrustBannerTextLoaded= once('oneTrust', '#onetrust-banner-sdk', context).shift();
        if (!oneTrustBannerTextLoaded) {
          return;
        }
        const oneTrustBannerText = document.querySelector('#onetrust-policy-text');
        // for each link force to open in same tab
        const bannerLinks = oneTrustBannerText.querySelectorAll('a');
        bannerLinks.forEach(link => {
          link.setAttribute('target', '_self');
          link.removeAttribute('rel');
        });

        // One trust just adds aria-label to first link it finds,
        // but in our usecase first link is not the privacy policy link
        // so we need to take that label and append it to the link where it belongs.
        const privacyAriaLabel = oneTrustBannerText.querySelector("[aria-label*='privacy']").ariaLabel.replace('opens in a new tab', 'opens in the same tab');
        const privacyLink = oneTrustBannerText.querySelector("[href*='privacy']");
        privacyLink.ariaLabel = privacyAriaLabel;
        // get the current aria label provided through OneTrust UI, replace the tab behavior text.
        oneTrustBannerText.querySelector("[href*='terms-of-use']").ariaLabel = "More information about UCSF terms of use, opens in the same tab";


      }, delayInMilliseconds);

    }
  }
  })($, Drupal, once)
