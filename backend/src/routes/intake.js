import express from 'express';
import { pool } from '../db.js';
import { authenticateUser } from '../middleware/authenticateUser.js';
import { validate as isUuid } from 'uuid';
const router = express.Router();
router.use(authenticateUser);
// Connectivity checks never return profiles or create demonstration records.
router.get('/health', (_req,res)=>res.json({success:true}));
router.post('/test', (_req,res)=>res.status(405).json({success:false,error:'Demonstration writes are disabled'}));
async function owner(req,res,target=req.user?.id) {
  if (!isUuid(req.user?.id || '') || target !== req.user.id) {
    res.status(403).json({success:false,error:'Private intake is accessible only to its owner'});
    return false;
  }
  const {rows}=await pool.query(`SELECT user_id FROM app_users
    WHERE user_id=$1 AND role='divorcee' AND organization_id IS NOT NULL`,[req.user.id]);
  if(rows.length!==1) {
    res.status(403).json({success:false,error:'An authorised preparation profile is required'});
    return false;
  }
  return true;
}
router.post('/',async(req,res)=>{
  try {
    if(!await owner(req,res,req.body.userId ?? req.user.id)) return;
    const {step,answers}=req.body;
    if(typeof step!=='string' || !step.trim() || step.length>100 || !answers || typeof answers!=='object' || Array.isArray(answers))
      return res.status(400).json({success:false,error:'A step and answer object are required'});
    const {rows}=await pool.query('INSERT INTO intake_answers(user_id,step,answers) VALUES($1,$2,$3) RETURNING *',
      [req.user.id,step,JSON.stringify(answers)]);
    return res.json({success:true,data:rows});
  }catch(_error){return res.status(503).json({success:false,error:'Private intake is unavailable'});}
});
router.get('/:userId',async(req,res)=>{
  try {
    if(!await owner(req,res,req.params.userId)) return;
    const {rows}=await pool.query('SELECT * FROM intake_answers WHERE user_id=$1',[req.user.id]);
    return res.json({success:true,data:rows});
  }catch(_error){return res.status(503).json({success:false,error:'Private intake is unavailable'});}
});
export default router;
