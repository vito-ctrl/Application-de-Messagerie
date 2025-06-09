const Ticket = require('../models/Ticket.js');

const createTicket = async (data) => {
  return await Ticket.create();
};

const getTickets = async () => {
  return await Ticket.find().populate('auteur assigné');
};

const getTicketById = async (id) => {
  return await Ticket.findById(id).populate('auteur assigné');
};

const updateTicket = async (id, data) => {
  return await Ticket.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });
};

const deleteTicket = async (id) => {
  return await Ticket.findByIdAndDelete(id);
};

module.exports = {
  createTicket,
  getTickets,
  getTicketById,
  updateTicket,
  deleteTicket,
};
