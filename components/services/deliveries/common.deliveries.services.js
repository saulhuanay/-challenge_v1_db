import Deliveries from '@/models/Deliveries.model';
import Products from '@/models/Products.model';

const find = async (req) => {
  // some vars
  let query = {};
  let limit = req.body.limit ? (req.body.limit > 100 ? 100 : parseInt(req.body.limit)) : 100;
  let skip = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
  let sort = { _id: 1 }

  // if date provided, filter by date
  if (req.body.when) {
    query['when'] = {
      '$gte': req.body.when
    }
  };

  let totalResults = await Deliveries.find(query).countDocuments();

  if (totalResults < 1) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find any delivery`
      }
    }
  }

  let deliveries = await Deliveries.find(query).skip(skip).sort(sort).limit(limit);

  return {
    totalResults: totalResults,
    deliveries
  }
}

const create = async (req) => {
  try {
    await Deliveries.create(req.body);
  } catch (e) {
    throw {
      code: 400,
      data: {
        message: `An error has occurred trying to create the delivery:
          ${JSON.stringify(e, null, 2)}`
      }
    }
  }
}

const findOne = async (req) => {
  let delivery = await Deliveries.findOne({_id: req.body.id});
  if (!delivery) {
    throw {
      code: 404,
      data: {
        message: `We couldn't find a delivery with the sent ID`
      }
    }
  }
  return delivery;
}

const filter = async (req) => {
  // some vars

  let limit = req.body.limit ? (req.body.limit > 100 ? 100 : parseInt(req.body.limit)) : 100;
  let pagina = req.body.page ? ((Math.max(0, parseInt(req.body.page)) - 1) * limit) : 0;
  let dateFrom = req.body.dateFrom ? req.body.dateFrom : new Date();
  let dateTo = req.body.dateTo ? req.body.dateFrom : new Date();
  let weight = req.body.weight ? req.body.weight : 0


  let $match = {}
  $match.$expr = {
    $and: [
      { $gte: ['$when', dateFrom] },
      { $lte: ['$when', dateTo] }
    ]
  }

const { count: cantidad, records: registros } = await Deliveries.aggregatePerPage([{
    $match
  }, 
  {
    $sort: {
      when: -1
    }
  },
  {
    $limit: limit
  }], pagina || 1)

if(!registros){
  throw {
    code: 404,
    data: {
      message: `No existen Registros`
    }
  }
}

let Productos = []
for (let i = 0; i < registros.length; i++) {
  const regi = registros[i];
  for (let j = 0; j < regi.products.length; j++) {
    const prod = regi.products[j];
    let products = await Products.findOne({_id: prod});
    if(products.weight >= weight){

        let datos ={ 
          reference:products.reference,
          description:products.description,
          weight:products.weight,
          height:products.height
        }

        Productos.push(datos);
    }

  }

  element.products = Productos;

}
  return { registros, totalResults }
}

export default {
  find,
  create,
  findOne,
  filter
}
