const router = require('express').Router();
const db = require('../_config');
const SocketIO = require('./socket-io-server');
const justNow = parseInt((Date.now() * 0.001).toFixed(0));

const bin = require('../lib/bin');
const activeGameSessions = bin.activeGameSessions;
const buildSession = bin.buildSession;

router.get('/gm/:userId', (req, res) => {
  const gm = req.params.userId;
  const query = `SELECT * FROM campaigns WHERE campaignGM = "${gm}";`;
  db.query(query)
    .then(([campaigns]) => {
      res.status(200).json(campaigns);
    });
});

router.get('/player/:userId', (req, res, next) => {
  const activeCampaigns = [];
  if (activeGameSessions.length) {
    for (const gameSession of activeGameSessions) {
      const campaign = {
        campaignId: gameSession.campaignId,
        campaignName: gameSession.campaignName
      };
      activeCampaigns.push(campaign);
    }
  }
  res.status(200).json(activeCampaigns);

});

router.get('/:campaignId/assets', (req, res) => {
  db.query(`SELECT * FROM images
              JOIN campaignImages ON images.imageId = campaignImages.imageId
              WHERE campaignImages.campaignId = ${req.params.campaignId}`)
    .then(([campaignAssets]) => {
      res.status(200).json(campaignAssets).end();
    });
});

router.post('/new', (req, res) => {
  const campaignGM = req.body.userId;
  const campaignName = req.body.campaignName;
  db.query(`INSERT INTO campaigns(campaignGM, campaignName) VALUES(${campaignGM}, "${campaignName}");`)
    .then(insertRes => {
      return db.query(`SELECT * FROM campaigns WHERE campaignId = ${insertRes[0].insertId}`);
    })
    .then(([newCampaign]) => {
      res.json(newCampaign[0]);
    });
});

router.post('/:campaignId/join', (req, res) => {
  const user = req.body.user;
  const campaign = req.body.campaign;

  db.query(`SELECT sessionId FROM sessions WHERE sessions.campaignId = ${campaign.campaignId};`)
    .then(([sessionRes]) => {
      if (sessionRes.length > 0) {
        return sessionRes[0];
      } else {
        return db.query(`INSERT INTO sessions(campaignID, updated) VALUES(${campaign.campaignId}, ${justNow});`)
          .then(insertRes => {
            return { sessionId: insertRes[0].insertId };
          });
      }
    })
    .then(result => {
      return buildSession(result.sessionId);
    })
    .then(session => {
      let alreadyActive = false;
      for (const activeSession of activeGameSessions) {
        if (activeSession.campaignId === campaign.campaignId) alreadyActive = true;
      }
      if (!alreadyActive) activeGameSessions.push(campaign);
      SocketIO.moveSocketToRoom(user.socketId, campaign.campaignId);
      res.json(session);
    });
});

router.delete('/:campaignId', (req, res) => {
  const campaignId = req.params.campaignId;
  db.query(`DELETE FROM campaigns WHERE campaignId = ${campaignId}`)
    .then(rowsAffected => res.json({ confirmNote: `Successfully deleted ${rowsAffected} campaign` }));
});

module.exports = router;
