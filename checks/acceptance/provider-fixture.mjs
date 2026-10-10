import { pool } from './database.mjs';
export const providerOperations = [];
export const requireSupabaseOr500 = res => res.status(503).json({ error: 'Fixture unavailable' });
export const supabase = {
  channel() { return { async send() {} }; },
  from(table) {
    if (!['cases','case_participants','requirement_templates','uploads','case_children','case_requirements'].includes(table)) throw Error('Unapproved fixture table');
    let operation='select',values,fields='*',one=false;
    const filters=[];
    const builder={
      select(columns='*') { fields=columns;return builder; },
      update(row) { operation='update';values=row;return builder; },
      insert(row) { operation='insert';values=row;return builder; },
      eq(column,value) { filters.push([column,value]);return builder; },
      is(column,value) { filters.push([column,value]);return builder; },
      single() { one=true;return builder; },
      maybeSingle() { one=true;return builder; },
      then(resolve,reject) { return execute().then(resolve,reject); }
    };
    async function execute() {
      providerOperations.push({table,operation,values,filters});
      if (['requirement_templates','case_children','case_requirements'].includes(table)) {
        if(operation!=='select') throw Error('Unapproved fixture write');
        return {data:[],error:null};
      }
      const params=[];
      const identifier=name=>{if(!/^[a-z_]+$/.test(name))throw Error('Invalid fixture identifier');return '"'+name+'"';};
      const bind=value=>{params.push(value);return '$'+params.length;};
      let sql;
      if(operation==='insert') {
        const keys=Object.keys(values);
        sql=`INSERT INTO ${table} (${keys.map(identifier).join(',')}) VALUES(${keys.map(k=>bind(values[k])).join(',')}) RETURNING *`;
      } else {
        sql=operation==='update'
          ? `UPDATE ${table} SET ${Object.keys(values).map(k=>identifier(k)+'='+bind(values[k])).join(',')}`
          : `SELECT ${fields==='*'?'*':fields.split(',').map(x=>identifier(x.trim())).join(',')} FROM ${table}`;
        if(filters.length)sql+=' WHERE '+filters.map(([k,v])=>identifier(k)+(v===null?' IS NULL':'='+bind(v))).join(' AND ');
        if(operation==='update')sql+=' RETURNING *';
      }
      try { const result=await pool.query(sql,params);return {data:one?result.rows[0]:result.rows,error:null}; }
      catch(error) { return {data:null,error:{code:error.code,message:error.message}}; }
    }
    return builder;
  }
};
