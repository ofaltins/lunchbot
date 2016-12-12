# Lunchbot

En Slack bot som gjør lunchbestillingen til en lek alle kan være med på!

I bedriftskollektivet Gamle Forusvei 11 samles vi daglig til trivelig lunch, men ting kan fort bli utrivelige om man ikke finner pålegget/drikken/smultringen man vil ha. Med Lunchbot kan alle finne varene de hungrer etter og legge de til handlelisten. Lunchbot tar seg av bestilling av handlelisten hos Joker Julebygda, som leverer varene dagen etterpå.

Og ikke nok med det! Lunchbot holder også styr på:

- hvem som kommer til lunch
- hvem som skal ha egg, samt totalt antall egg som må kokes
- påminnelser for å dekke bord
- påminnelser for å samle alle rundt bordet til lunchtid
- påminnelser for å legge ting i handlelisten
- påminnelser for å bestille lunch

![Lunchbot i aksjon](https://github.com/ofaltins/lunchbot/blob/master/screenshots/lunchbot-in-action.png "Lunchbot i aksjon")

## Installasjon

1. Sett opp en ny bot på https://yourorganization.slack.com/services/new/bot og få en Slack Token.
2. Clone repo
3. Kjør `npm install`
4. Konfigurer Lunchbot
5. Kjør `npm run serve`

### Konfigurering
**Dersom `process.env.NODE_ENV !== 'production'`:**
Bytt navn på config.js.sample til config.js og legg inn parametere i henhold til kommentarene i filen

**Ellers**
Bruk environment variabler tilsvarende det som står i config fila, for eksempel dersom man bruker [dokku](https://github.com/dokku/dokku):

```
dokku config:set lunchbot slack_token=DIN_SLACK_TOKEN bot_name=lunchbot keyword=lb primary_channel=lunch julebygda_user=brukernavn julebygda_password=passord default_admin=DITT_BRUKERNAVN
```
